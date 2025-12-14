import { IcsGenerationResult } from "../types";

interface ProcessOptions {
  startDate?: string; // Format: YYYY-MM-DDTHH:mm
  isWeekly?: boolean;
  weeklyCount?: number;
}

export const generateIcsFromText = async (inputText: string, options: ProcessOptions = {}): Promise<IcsGenerationResult> => {
  // 1. Basic cleaning: Trim whitespace
  let cleanText = inputText.trim();

  if (!cleanText) {
    throw new Error("Input text cannot be empty.");
  }

  // 2. Line Ending Normalization (Crucial for Apple/Safari)
  cleanText = cleanText.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');

  // 3. Apply Options (Start Date & Recurrence)
  // We apply these changes before wrapping in VCALENDAR to ensure regex finds VEVENT props
  
  // Handle Start Date Override
  if (options.startDate) {
    // 3a. Prepare New Start Date
    // options.startDate is "YYYY-MM-DDTHH:mm"
    const newStartDate = new Date(options.startDate);
    
    // Format for ICS: YYYYMMDDTHHmm00 (Floating time)
    const formatIcs = (d: Date) => {
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    };
    
    const newDtStartVal = formatIcs(newStartDate);
    const newDtStartLine = `DTSTART:${newDtStartVal}`;

    // 3b. Find Old Start/End to Calculate Duration and Shift End Time
    // Regex matches DTSTART:Value or DTSTART;Params:Value
    const startMatch = cleanText.match(/^DTSTART(?:[:;].*?)?:(.*?)(\r)?$/m);
    
    if (startMatch) {
        const oldStartVal = startMatch[1];
        
        // Try to find End Date to shift it
        const endMatch = cleanText.match(/^DTEND(?:[:;].*?)?:(.*?)(\r)?$/m);
        
        if (endMatch) {
            const oldEndVal = endMatch[1];
            
            // Simple parser for existing ICS dates (YYYYMMDDTHHmmss[Z])
            // We strip non-digits to treat everything as local/relative for duration calculation
            const parseIcsDate = (val: string): Date => {
                const cleaned = val.replace(/[^0-9T]/g, ''); 
                const y = parseInt(cleaned.substring(0, 4));
                const m = parseInt(cleaned.substring(4, 6)) - 1;
                const d = parseInt(cleaned.substring(6, 8));
                let h = 0, min = 0, s = 0;
                if (cleaned.includes('T')) {
                    const t = cleaned.split('T')[1];
                    h = parseInt(t.substring(0, 2));
                    min = parseInt(t.substring(2, 4));
                    s = parseInt(t.substring(4, 6)) || 0;
                }
                return new Date(y, m, d, h, min, s);
            };

            const oldStart = parseIcsDate(oldStartVal);
            const oldEnd = parseIcsDate(oldEndVal);
            
            // Calculate Duration
            const duration = oldEnd.getTime() - oldStart.getTime();
            
            // Calculate New End Date based on New Start + Duration
            if (!isNaN(duration) && duration >= 0) {
                const newEndDate = new Date(newStartDate.getTime() + duration);
                const newDtEndVal = formatIcs(newEndDate);
                const newDtEndLine = `DTEND:${newDtEndVal}`;
                
                // Replace DTEND line completely
                cleanText = cleanText.replace(/^DTEND[:;].*$/m, newDtEndLine);
            }
        }
        
        // Replace DTSTART line completely
        cleanText = cleanText.replace(/^DTSTART[:;].*$/m, newDtStartLine);
        
    } else {
        // Fallback: No existing DTSTART found, just insert the new one
        if (cleanText.includes("BEGIN:VEVENT")) {
             cleanText = cleanText.replace("BEGIN:VEVENT", `BEGIN:VEVENT\r\n${newDtStartLine}`);
        } else {
             cleanText = `${newDtStartLine}\r\n${cleanText}`;
        }
    }
  }

  // Handle Weekly Recurrence
  if (options.isWeekly) {
    let rruleLine = "RRULE:FREQ=WEEKLY";
    if (options.weeklyCount && options.weeklyCount > 0) {
      rruleLine += `;COUNT=${options.weeklyCount}`;
    }

    // Check if RRULE exists
    if (/^RRULE:.*$/m.test(cleanText)) {
      cleanText = cleanText.replace(/^RRULE:.*$/m, rruleLine);
    } else if (cleanText.includes("END:VEVENT")) {
      // Insert before END:VEVENT
      cleanText = cleanText.replace("END:VEVENT", `${rruleLine}\r\nEND:VEVENT`);
    } else {
       cleanText = `${cleanText}\r\n${rruleLine}`;
    }
  }

  // 4. Basic Heuristics to ensure valid ICS structure
  const hasCalendarWrapper = cleanText.includes("BEGIN:VCALENDAR");
  
  if (!hasCalendarWrapper) {
    const header = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//ICS Magic Converter//Raw Formatter//EN",
      "CALSCALE:GREGORIAN"
    ].join("\r\n");
    
    const footer = "END:VCALENDAR";
    
    cleanText = `${header}\r\n${cleanText}\r\n${footer}`;
  }

  // 5. Extract Summary for UI display
  const summaryMatch = cleanText.match(/^SUMMARY:(.*)$/im);
  const summary = summaryMatch ? summaryMatch[1].trim() : "Processed Calendar Event";

  // 6. Generate Filename
  let filename = "event.ics";
  if (summary && summary !== "Processed Calendar Event") {
    const safeSummary = summary.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);
    filename = `${safeSummary}.ics`;
  }

  // Return formatted result
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        icsContent: cleanText,
        filename: filename,
        summary: summary
      });
    }, 600);
  });
};