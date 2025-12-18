import { IcsGenerationResult } from "../types";

interface ProcessOptions {
  startDate?: string; // Format: YYYY-MM-DDTHH:mm
  isWeekly?: boolean;
  weeklyCount?: number;
}

// Helper: Parse ICS Date string (YYYYMMDDTHHmmss[Z]) to JS Date
const parseIcsDate = (val: string): Date | null => {
  if (!val) return null;
  const cleaned = val.replace(/[^0-9T]/g, ''); 
  if (cleaned.length < 8) return null;

  const y = parseInt(cleaned.substring(0, 4));
  const m = parseInt(cleaned.substring(4, 6)) - 1;
  const d = parseInt(cleaned.substring(6, 8));
  let h = 0, min = 0, s = 0;
  
  if (cleaned.includes('T')) {
      const t = cleaned.split('T')[1];
      h = parseInt(t.substring(0, 2)) || 0;
      min = parseInt(t.substring(2, 4)) || 0;
      s = parseInt(t.substring(4, 6)) || 0;
  }
  return new Date(y, m, d, h, min, s);
};

// Helper: Format JS Date to ICS string (YYYYMMDDTHHmm00)
// We use local time logic to keep it simple and wall-clock accurate for the user
const formatIcsDate = (d: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
};

// Helper: Extract value from a specific line key
// Robustly handles keys with parameters e.g., DTSTART;TZID=Asia/Shanghai:2023...
const getLineValue = (block: string, key: string): string | null => {
  // Regex explanation:
  // ^KEY            : Start with key
  // (?:[;].*?)?     : Optional parameters starting with ; and ending before the colon
  // :               : The separator colon
  // (.*?)           : Capture the value
  // (\r)?$          : End of line
  const regex = new RegExp(`^${key}(?:[:;].*?)?:(.*?)(\r)?$`, 'm');
  const match = block.match(regex);
  return match ? match[1] : null;
};

export const generateIcsFromText = async (inputText: string, options: ProcessOptions = {}): Promise<IcsGenerationResult> => {
  return new Promise((resolve, reject) => {
    try {
      // 1. Basic cleaning
      let cleanText = inputText.trim().replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
      
      // 2. Extract all VEVENT blocks
      const eventBlocks: string[] = [];
      const eventRegex = /BEGIN:VEVENT[\s\S]*?END:VEVENT/g;
      let match;
      while ((match = eventRegex.exec(cleanText)) !== null) {
        eventBlocks.push(match[0]);
      }

      if (eventBlocks.length === 0) {
        // Attempt to treat the whole text as body if no VEVENT tags found (simple fallback)
        eventBlocks.push(`BEGIN:VEVENT\r\n${cleanText}\r\nEND:VEVENT`);
      }

      // 3. Determine Time Offset
      let timeOffset = 0;
      
      if (options.startDate) {
        // User wants to start on a specific date.
        // We find the EARLIEST start date in the original provided events.
        // Then we shift ALL events by the difference.
        
        let earliestOriginal: Date | null = null;

        eventBlocks.forEach(block => {
          const dtStartVal = getLineValue(block, 'DTSTART');
          if (dtStartVal) {
            const d = parseIcsDate(dtStartVal);
            if (d) {
              if (!earliestOriginal || d < earliestOriginal) {
                earliestOriginal = d;
              }
            }
          }
        });

        if (earliestOriginal) {
          const targetStart = new Date(options.startDate);
          timeOffset = targetStart.getTime() - earliestOriginal.getTime();
        }
      }

      // 4. Generate Expanded Events
      const finalEvents: string[] = [];
      const repeatCount = (options.isWeekly && options.weeklyCount) ? options.weeklyCount : 1;

      // Outer loop: Weeks
      for (let i = 0; i < repeatCount; i++) {
        const weekOffset = i * 7 * 24 * 60 * 60 * 1000; // milliseconds in i weeks

        // Inner loop: Original Events
        eventBlocks.forEach((originalBlock, index) => {
          let newBlock = originalBlock;

          // 4a. Adjust Times (Start)
          const startVal = getLineValue(newBlock, 'DTSTART');
          if (startVal) {
            const originalDate = parseIcsDate(startVal);
            if (originalDate) {
              const newDate = new Date(originalDate.getTime() + timeOffset + weekOffset);
              const newDateStr = formatIcsDate(newDate);
              // Replace the whole line to strip timezone params and enforce floating time
              newBlock = newBlock.replace(/^DTSTART(?:[:;].*?)?:(.*?)(\r)?$/m, `DTSTART:${newDateStr}`);
            }
          }

          // 4b. Adjust Times (End)
          const endVal = getLineValue(newBlock, 'DTEND');
          if (endVal) {
             const originalDate = parseIcsDate(endVal);
             if (originalDate) {
               const newDate = new Date(originalDate.getTime() + timeOffset + weekOffset);
               const newDateStr = formatIcsDate(newDate);
               newBlock = newBlock.replace(/^DTEND(?:[:;].*?)?:(.*?)(\r)?$/m, `DTEND:${newDateStr}`);
             }
          }

          // 4c. Unique ID handling for repeats
          // If we are repeating, we must change the UID or Apple Calendar will merge them
          if (repeatCount > 1) {
             const uidVal = getLineValue(newBlock, 'UID');
             if (uidVal) {
               // Append week index to UID to make it unique
               newBlock = newBlock.replace(/^UID:(.*?)(\r)?$/m, `UID:${uidVal}-W${i}`);
             } else {
               // Create a UID if missing
               const newUid = `generated-${index}-week-${i}-${Date.now()}@icsmagic`;
               if (newBlock.includes("END:VEVENT")) {
                 newBlock = newBlock.replace("END:VEVENT", `UID:${newUid}\r\nEND:VEVENT`);
               } else {
                 newBlock += `\r\nUID:${newUid}`;
               }
             }
          }

          // 4d. Remove any existing RRULE if we are manually expanding
          if (options.isWeekly) {
             newBlock = newBlock.replace(/^RRULE:.*$(\r\n|\r|\n)?/m, '');
          }

          finalEvents.push(newBlock);
        });
      }

      // 5. Wrap in Calendar
      const summary = getLineValue(finalEvents[0], 'SUMMARY') || "Exported Schedule";
      
      const header = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//ICS Magic Converter//Expanded Generator//EN",
        "CALSCALE:GREGORIAN"
      ].join("\r\n");
      
      const footer = "END:VCALENDAR";
      const fullContent = `${header}\r\n${finalEvents.join("\r\n")}\r\n${footer}`;

      // 6. Filename
      const safeSummary = summary.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);
      const filename = `${safeSummary}_${repeatCount}weeks.ics`;

      setTimeout(() => {
        resolve({
          icsContent: fullContent,
          filename: filename,
          summary: `${summary} (x${repeatCount} weeks)`
        });
      }, 500);

    } catch (err) {
      reject(err);
    }
  });
};