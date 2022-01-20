import { Tokenizer, } from "./tokenizer.ts";
function digits(value, count = 2) {
    return String(value).padStart(count, "0");
}
function createLiteralTestFunction(value) {
    return (string) => {
        return string.startsWith(value)
            ? { value, length: value.length }
            : undefined;
    };
}
function createMatchTestFunction(match) {
    return (string) => {
        const result = match.exec(string);
        if (result)
            return { value: result, length: result[0].length };
    };
}
const defaultRules = [
    {
        test: createLiteralTestFunction("yyyy"),
        fn: () => ({ type: "year", value: "numeric" }),
    },
    {
        test: createLiteralTestFunction("yy"),
        fn: () => ({ type: "year", value: "2-digit" }),
    },
    {
        test: createLiteralTestFunction("MM"),
        fn: () => ({ type: "month", value: "2-digit" }),
    },
    {
        test: createLiteralTestFunction("M"),
        fn: () => ({ type: "month", value: "numeric" }),
    },
    {
        test: createLiteralTestFunction("dd"),
        fn: () => ({ type: "day", value: "2-digit" }),
    },
    {
        test: createLiteralTestFunction("d"),
        fn: () => ({ type: "day", value: "numeric" }),
    },
    {
        test: createLiteralTestFunction("HH"),
        fn: () => ({ type: "hour", value: "2-digit" }),
    },
    {
        test: createLiteralTestFunction("H"),
        fn: () => ({ type: "hour", value: "numeric" }),
    },
    {
        test: createLiteralTestFunction("hh"),
        fn: () => ({
            type: "hour",
            value: "2-digit",
            hour12: true,
        }),
    },
    {
        test: createLiteralTestFunction("h"),
        fn: () => ({
            type: "hour",
            value: "numeric",
            hour12: true,
        }),
    },
    {
        test: createLiteralTestFunction("mm"),
        fn: () => ({ type: "minute", value: "2-digit" }),
    },
    {
        test: createLiteralTestFunction("m"),
        fn: () => ({ type: "minute", value: "numeric" }),
    },
    {
        test: createLiteralTestFunction("ss"),
        fn: () => ({ type: "second", value: "2-digit" }),
    },
    {
        test: createLiteralTestFunction("s"),
        fn: () => ({ type: "second", value: "numeric" }),
    },
    {
        test: createLiteralTestFunction("SSS"),
        fn: () => ({ type: "fractionalSecond", value: 3 }),
    },
    {
        test: createLiteralTestFunction("SS"),
        fn: () => ({ type: "fractionalSecond", value: 2 }),
    },
    {
        test: createLiteralTestFunction("S"),
        fn: () => ({ type: "fractionalSecond", value: 1 }),
    },
    {
        test: createLiteralTestFunction("a"),
        fn: (value) => ({
            type: "dayPeriod",
            value: value,
        }),
    },
    {
        test: createMatchTestFunction(/^(')(?<value>\\.|[^\']*)\1/),
        fn: (match) => ({
            type: "literal",
            value: match.groups.value,
        }),
    },
    {
        test: createMatchTestFunction(/^.+?\s*/),
        fn: (match) => ({
            type: "literal",
            value: match[0],
        }),
    },
];
export class DateTimeFormatter {
    #format;
    constructor(formatString, rules = defaultRules) {
        const tokenizer = new Tokenizer(rules);
        this.#format = tokenizer.tokenize(formatString, ({ type, value, hour12 }) => {
            const result = {
                type,
                value,
            };
            if (hour12)
                result.hour12 = hour12;
            return result;
        });
    }
    format(date, options = {}) {
        let string = "";
        const utc = options.timeZone === "UTC";
        for (const token of this.#format) {
            const type = token.type;
            switch (type) {
                case "year": {
                    const value = utc ? date.getUTCFullYear() : date.getFullYear();
                    switch (token.value) {
                        case "numeric": {
                            string += value;
                            break;
                        }
                        case "2-digit": {
                            string += digits(value, 2).slice(-2);
                            break;
                        }
                        default:
                            throw Error(`FormatterError: value "${token.value}" is not supported`);
                    }
                    break;
                }
                case "month": {
                    const value = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
                    switch (token.value) {
                        case "numeric": {
                            string += value;
                            break;
                        }
                        case "2-digit": {
                            string += digits(value, 2);
                            break;
                        }
                        default:
                            throw Error(`FormatterError: value "${token.value}" is not supported`);
                    }
                    break;
                }
                case "day": {
                    const value = utc ? date.getUTCDate() : date.getDate();
                    switch (token.value) {
                        case "numeric": {
                            string += value;
                            break;
                        }
                        case "2-digit": {
                            string += digits(value, 2);
                            break;
                        }
                        default:
                            throw Error(`FormatterError: value "${token.value}" is not supported`);
                    }
                    break;
                }
                case "hour": {
                    let value = utc ? date.getUTCHours() : date.getHours();
                    value -= token.hour12 && date.getHours() > 12 ? 12 : 0;
                    switch (token.value) {
                        case "numeric": {
                            string += value;
                            break;
                        }
                        case "2-digit": {
                            string += digits(value, 2);
                            break;
                        }
                        default:
                            throw Error(`FormatterError: value "${token.value}" is not supported`);
                    }
                    break;
                }
                case "minute": {
                    const value = utc ? date.getUTCMinutes() : date.getMinutes();
                    switch (token.value) {
                        case "numeric": {
                            string += value;
                            break;
                        }
                        case "2-digit": {
                            string += digits(value, 2);
                            break;
                        }
                        default:
                            throw Error(`FormatterError: value "${token.value}" is not supported`);
                    }
                    break;
                }
                case "second": {
                    const value = utc ? date.getUTCSeconds() : date.getSeconds();
                    switch (token.value) {
                        case "numeric": {
                            string += value;
                            break;
                        }
                        case "2-digit": {
                            string += digits(value, 2);
                            break;
                        }
                        default:
                            throw Error(`FormatterError: value "${token.value}" is not supported`);
                    }
                    break;
                }
                case "fractionalSecond": {
                    const value = utc
                        ? date.getUTCMilliseconds()
                        : date.getMilliseconds();
                    string += digits(value, Number(token.value));
                    break;
                }
                case "timeZoneName": {
                    break;
                }
                case "dayPeriod": {
                    string += token.value ? (date.getHours() >= 12 ? "PM" : "AM") : "";
                    break;
                }
                case "literal": {
                    string += token.value;
                    break;
                }
                default:
                    throw Error(`FormatterError: { ${token.type} ${token.value} }`);
            }
        }
        return string;
    }
    parseToParts(string) {
        const parts = [];
        for (const token of this.#format) {
            const type = token.type;
            let value = "";
            switch (token.type) {
                case "year": {
                    switch (token.value) {
                        case "numeric": {
                            value = /^\d{1,4}/.exec(string)?.[0];
                            break;
                        }
                        case "2-digit": {
                            value = /^\d{1,2}/.exec(string)?.[0];
                            break;
                        }
                    }
                    break;
                }
                case "month": {
                    switch (token.value) {
                        case "numeric": {
                            value = /^\d{1,2}/.exec(string)?.[0];
                            break;
                        }
                        case "2-digit": {
                            value = /^\d{2}/.exec(string)?.[0];
                            break;
                        }
                        case "narrow": {
                            value = /^[a-zA-Z]+/.exec(string)?.[0];
                            break;
                        }
                        case "short": {
                            value = /^[a-zA-Z]+/.exec(string)?.[0];
                            break;
                        }
                        case "long": {
                            value = /^[a-zA-Z]+/.exec(string)?.[0];
                            break;
                        }
                        default:
                            throw Error(`ParserError: value "${token.value}" is not supported`);
                    }
                    break;
                }
                case "day": {
                    switch (token.value) {
                        case "numeric": {
                            value = /^\d{1,2}/.exec(string)?.[0];
                            break;
                        }
                        case "2-digit": {
                            value = /^\d{2}/.exec(string)?.[0];
                            break;
                        }
                        default:
                            throw Error(`ParserError: value "${token.value}" is not supported`);
                    }
                    break;
                }
                case "hour": {
                    switch (token.value) {
                        case "numeric": {
                            value = /^\d{1,2}/.exec(string)?.[0];
                            if (token.hour12 && parseInt(value) > 12) {
                                console.error(`Trying to parse hour greater than 12. Use 'H' instead of 'h'.`);
                            }
                            break;
                        }
                        case "2-digit": {
                            value = /^\d{2}/.exec(string)?.[0];
                            if (token.hour12 && parseInt(value) > 12) {
                                console.error(`Trying to parse hour greater than 12. Use 'HH' instead of 'hh'.`);
                            }
                            break;
                        }
                        default:
                            throw Error(`ParserError: value "${token.value}" is not supported`);
                    }
                    break;
                }
                case "minute": {
                    switch (token.value) {
                        case "numeric": {
                            value = /^\d{1,2}/.exec(string)?.[0];
                            break;
                        }
                        case "2-digit": {
                            value = /^\d{2}/.exec(string)?.[0];
                            break;
                        }
                        default:
                            throw Error(`ParserError: value "${token.value}" is not supported`);
                    }
                    break;
                }
                case "second": {
                    switch (token.value) {
                        case "numeric": {
                            value = /^\d{1,2}/.exec(string)?.[0];
                            break;
                        }
                        case "2-digit": {
                            value = /^\d{2}/.exec(string)?.[0];
                            break;
                        }
                        default:
                            throw Error(`ParserError: value "${token.value}" is not supported`);
                    }
                    break;
                }
                case "fractionalSecond": {
                    value = new RegExp(`^\\d{${token.value}}`).exec(string)?.[0];
                    break;
                }
                case "timeZoneName": {
                    value = token.value;
                    break;
                }
                case "dayPeriod": {
                    value = /^(A|P)M/.exec(string)?.[0];
                    break;
                }
                case "literal": {
                    if (!string.startsWith(token.value)) {
                        throw Error(`Literal "${token.value}" not found "${string.slice(0, 25)}"`);
                    }
                    value = token.value;
                    break;
                }
                default:
                    throw Error(`${token.type} ${token.value}`);
            }
            if (!value) {
                throw Error(`value not valid for token { ${type} ${value} } ${string.slice(0, 25)}`);
            }
            parts.push({ type, value });
            string = string.slice(value.length);
        }
        if (string.length) {
            throw Error(`datetime string was not fully parsed! ${string.slice(0, 25)}`);
        }
        return parts;
    }
    sortDateTimeFormatPart(parts) {
        let result = [];
        const typeArray = [
            "year",
            "month",
            "day",
            "hour",
            "minute",
            "second",
            "fractionalSecond",
        ];
        for (const type of typeArray) {
            const current = parts.findIndex((el) => el.type === type);
            if (current !== -1) {
                result = result.concat(parts.splice(current, 1));
            }
        }
        result = result.concat(parts);
        return result;
    }
    partsToDate(parts) {
        const date = new Date();
        const utc = parts.find((part) => part.type === "timeZoneName" && part.value === "UTC");
        const dayPart = parts.find((part) => part.type === "day");
        utc ? date.setUTCHours(0, 0, 0, 0) : date.setHours(0, 0, 0, 0);
        for (const part of parts) {
            switch (part.type) {
                case "year": {
                    const value = Number(part.value.padStart(4, "20"));
                    utc ? date.setUTCFullYear(value) : date.setFullYear(value);
                    break;
                }
                case "month": {
                    const value = Number(part.value) - 1;
                    if (dayPart) {
                        utc
                            ? date.setUTCMonth(value, Number(dayPart.value))
                            : date.setMonth(value, Number(dayPart.value));
                    }
                    else {
                        utc ? date.setUTCMonth(value) : date.setMonth(value);
                    }
                    break;
                }
                case "day": {
                    const value = Number(part.value);
                    utc ? date.setUTCDate(value) : date.setDate(value);
                    break;
                }
                case "hour": {
                    let value = Number(part.value);
                    const dayPeriod = parts.find((part) => part.type === "dayPeriod");
                    if (dayPeriod?.value === "PM")
                        value += 12;
                    utc ? date.setUTCHours(value) : date.setHours(value);
                    break;
                }
                case "minute": {
                    const value = Number(part.value);
                    utc ? date.setUTCMinutes(value) : date.setMinutes(value);
                    break;
                }
                case "second": {
                    const value = Number(part.value);
                    utc ? date.setUTCSeconds(value) : date.setSeconds(value);
                    break;
                }
                case "fractionalSecond": {
                    const value = Number(part.value);
                    utc ? date.setUTCMilliseconds(value) : date.setMilliseconds(value);
                    break;
                }
            }
        }
        return date;
    }
    parse(string) {
        const parts = this.parseToParts(string);
        const sortParts = this.sortDateTimeFormatPart(parts);
        return this.partsToDate(sortParts);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZm9ybWF0dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFNTCxTQUFTLEdBQ1YsTUFBTSxnQkFBZ0IsQ0FBQztBQUV4QixTQUFTLE1BQU0sQ0FBQyxLQUFzQixFQUFFLEtBQUssR0FBRyxDQUFDO0lBQy9DLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDNUMsQ0FBQztBQTRCRCxTQUFTLHlCQUF5QixDQUFDLEtBQWE7SUFDOUMsT0FBTyxDQUFDLE1BQWMsRUFBYyxFQUFFO1FBQ3BDLE9BQU8sTUFBTSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7WUFDN0IsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTSxFQUFFO1lBQ2pDLENBQUMsQ0FBQyxTQUFTLENBQUM7SUFDaEIsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsdUJBQXVCLENBQUMsS0FBYTtJQUM1QyxPQUFPLENBQUMsTUFBYyxFQUFjLEVBQUU7UUFDcEMsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsQyxJQUFJLE1BQU07WUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ2pFLENBQUMsQ0FBQztBQUNKLENBQUM7QUFHRCxNQUFNLFlBQVksR0FBRztJQUNuQjtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxNQUFNLENBQUM7UUFDdkMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDL0Q7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7UUFDckMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDL0Q7SUFFRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7UUFDckMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDaEU7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxHQUFHLENBQUM7UUFDcEMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDaEU7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7UUFDckMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDOUQ7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxHQUFHLENBQUM7UUFDcEMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDOUQ7SUFFRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7UUFDckMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDL0Q7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxHQUFHLENBQUM7UUFDcEMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDL0Q7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7UUFDckMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDO1lBQ3pCLElBQUksRUFBRSxNQUFNO1lBQ1osS0FBSyxFQUFFLFNBQVM7WUFDaEIsTUFBTSxFQUFFLElBQUk7U0FDYixDQUFDO0tBQ0g7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxHQUFHLENBQUM7UUFDcEMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDO1lBQ3pCLElBQUksRUFBRSxNQUFNO1lBQ1osS0FBSyxFQUFFLFNBQVM7WUFDaEIsTUFBTSxFQUFFLElBQUk7U0FDYixDQUFDO0tBQ0g7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7UUFDckMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDakU7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxHQUFHLENBQUM7UUFDcEMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDakU7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7UUFDckMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDakU7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxHQUFHLENBQUM7UUFDcEMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDakU7SUFDRDtRQUNFLElBQUksRUFBRSx5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LENBQUM7b0JBQ2pDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNuRSxNQUFNO2lCQUNQO2FBQ0Y7U0FDRjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELEtBQUssQ0FBQyxNQUFjO1FBQ2xCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDeEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JELE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNyQyxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IHtcbiAgQ2FsbGJhY2tSZXN1bHQsXG4gIFJlY2VpdmVyUmVzdWx0LFxuICBSdWxlLFxuICBUZXN0RnVuY3Rpb24sXG4gIFRlc3RSZXN1bHQsXG4gIFRva2VuaXplcixcbn0gZnJvbSBcIi4vdG9rZW5pemVyLnRzXCI7XG5cbmZ1bmN0aW9uIGRpZ2l0cyh2YWx1ZTogc3RyaW5nIHwgbnVtYmVyLCBjb3VudCA9IDIpOiBzdHJpbmcge1xuICByZXR1cm4gU3RyaW5nKHZhbHVlKS5wYWRTdGFydChjb3VudCwgXCIwXCIpO1xufVxuXG4vLyBhcyBkZWNsYXJlZCBhcyBpbiBuYW1lc3BhY2UgSW50bFxudHlwZSBEYXRlVGltZUZvcm1hdFBhcnRUeXBlcyA9XG4gIHwgXCJkYXlcIlxuICB8IFwiZGF5UGVyaW9kXCJcbiAgLy8gfCBcImVyYVwiXG4gIHwgXCJob3VyXCJcbiAgfCBcImxpdGVyYWxcIlxuICB8IFwibWludXRlXCJcbiAgfCBcIm1vbnRoXCJcbiAgfCBcInNlY29uZFwiXG4gIHwgXCJ0aW1lWm9uZU5hbWVcIlxuICAvLyB8IFwid2Vla2RheVwiXG4gIHwgXCJ5ZWFyXCJcbiAgfCBcImZyYWN0aW9uYWxTZWNvbmRcIjtcblxuaW50ZXJmYWNlIERhdGVUaW1lRm9ybWF0UGFydCB7XG4gIHR5cGU6IERhdGVUaW1lRm9ybWF0UGFydFR5cGVzO1xuICB2YWx1ZTogc3RyaW5nO1xufVxuXG50eXBlIFRpbWVab25lID0gXCJVVENcIjtcblxuaW50ZXJmYWNlIE9wdGlvbnMge1xuICB0aW1lWm9uZT86IFRpbWVab25lO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKHZhbHVlOiBzdHJpbmcpOiBUZXN0RnVuY3Rpb24ge1xuICByZXR1cm4gKHN0cmluZzogc3RyaW5nKTogVGVzdFJlc3VsdCA9PiB7XG4gICAgcmV0dXJuIHN0cmluZy5zdGFydHNXaXRoKHZhbHVlKVxuICAgICAgPyB7IHZhbHVlLCBsZW5ndGg6IHZhbHVlLmxlbmd0aCB9XG4gICAgICA6IHVuZGVmaW5lZDtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTWF0Y2hUZXN0RnVuY3Rpb24obWF0Y2g6IFJlZ0V4cCk6IFRlc3RGdW5jdGlvbiB7XG4gIHJldHVybiAoc3RyaW5nOiBzdHJpbmcpOiBUZXN0UmVzdWx0ID0+IHtcbiAgICBjb25zdCByZXN1bHQgPSBtYXRjaC5leGVjKHN0cmluZyk7XG4gICAgaWYgKHJlc3VsdCkgcmV0dXJuIHsgdmFsdWU6IHJlc3VsdCwgbGVuZ3RoOiByZXN1bHRbMF0ubGVuZ3RoIH07XG4gIH07XG59XG5cbi8vIGFjY29yZGluZyB0byB1bmljb2RlIHN5bWJvbHMgKGh0dHA6Ly93d3cudW5pY29kZS5vcmcvcmVwb3J0cy90cjM1L3RyMzUtZGF0ZXMuaHRtbCNEYXRlX0ZpZWxkX1N5bWJvbF9UYWJsZSlcbmNvbnN0IGRlZmF1bHRSdWxlcyA9IFtcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJ5eXl5XCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJ5ZWFyXCIsIHZhbHVlOiBcIm51bWVyaWNcIiB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJ5eVwiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwieWVhclwiLCB2YWx1ZTogXCIyLWRpZ2l0XCIgfSksXG4gIH0sXG5cbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJNTVwiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwibW9udGhcIiwgdmFsdWU6IFwiMi1kaWdpdFwiIH0pLFxuICB9LFxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcIk1cIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcIm1vbnRoXCIsIHZhbHVlOiBcIm51bWVyaWNcIiB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJkZFwiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwiZGF5XCIsIHZhbHVlOiBcIjItZGlnaXRcIiB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJkXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJkYXlcIiwgdmFsdWU6IFwibnVtZXJpY1wiIH0pLFxuICB9LFxuXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiSEhcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcImhvdXJcIiwgdmFsdWU6IFwiMi1kaWdpdFwiIH0pLFxuICB9LFxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcIkhcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcImhvdXJcIiwgdmFsdWU6IFwibnVtZXJpY1wiIH0pLFxuICB9LFxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcImhoXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHtcbiAgICAgIHR5cGU6IFwiaG91clwiLFxuICAgICAgdmFsdWU6IFwiMi1kaWdpdFwiLFxuICAgICAgaG91cjEyOiB0cnVlLFxuICAgIH0pLFxuICB9LFxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcImhcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoe1xuICAgICAgdHlwZTogXCJob3VyXCIsXG4gICAgICB2YWx1ZTogXCJudW1lcmljXCIsXG4gICAgICBob3VyMTI6IHRydWUsXG4gICAgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwibW1cIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcIm1pbnV0ZVwiLCB2YWx1ZTogXCIyLWRpZ2l0XCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwibVwiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwibWludXRlXCIsIHZhbHVlOiBcIm51bWVyaWNcIiB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJzc1wiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwic2Vjb25kXCIsIHZhbHVlOiBcIjItZGlnaXRcIiB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJzXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJzZWNvbmRcIiwgdmFsdWU6IFwibnVtZXJpY1wiIH0pLFxuICB9LFxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcIlNTU1wiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwiZnJhY3Rpb25hbFNlY29uZFwiLCB2YWx1ZTogMyB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJTU1wiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwiZnJhY3Rpb25hbFNlY29uZFwiLCB2YWx1ZTogMiB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJTXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJmcmFjdGlvbmFsU2Vjb25kXCIsIHZhbHVlOiAxIH0pLFxuICB9LFxuXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiYVwiKSxcbiAgICBmbjogKHZhbHVlOiB1bmtub3duKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHtcbiAgICAgIHR5cGU6IFwiZGF5UGVyaW9kXCIsXG4gICAgICB2YWx1ZTogdmFsdWUgYXMgc3RyaW5nLFxuICAgIH0pLFxuICB9LFxuXG4gIC8vIHF1b3RlZCBsaXRlcmFsXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVNYXRjaFRlc3RGdW5jdGlvbigvXignKSg/PHZhbHVlPlxcXFwufFteXFwnXSopXFwxLyksXG4gICAgZm46IChtYXRjaDogdW5rbm93bik6IENhbGxiYWNrUmVzdWx0ID0+ICh7XG4gICAgICB0eXBlOiBcImxpdGVyYWxcIixcbiAgICAgIHZhbHVlOiAobWF0Y2ggYXMgUmVnRXhwRXhlY0FycmF5KS5ncm91cHMhLnZhbHVlIGFzIHN0cmluZyxcbiAgICB9KSxcbiAgfSxcbiAgLy8gbGl0ZXJhbFxuICB7XG4gICAgdGVzdDogY3JlYXRlTWF0Y2hUZXN0RnVuY3Rpb24oL14uKz9cXHMqLyksXG4gICAgZm46IChtYXRjaDogdW5rbm93bik6IENhbGxiYWNrUmVzdWx0ID0+ICh7XG4gICAgICB0eXBlOiBcImxpdGVyYWxcIixcbiAgICAgIHZhbHVlOiAobWF0Y2ggYXMgUmVnRXhwRXhlY0FycmF5KVswXSxcbiAgICB9KSxcbiAgfSxcbl07XG5cbnR5cGUgRm9ybWF0UGFydCA9IHtcbiAgdHlwZTogRGF0ZVRpbWVGb3JtYXRQYXJ0VHlwZXM7XG4gIHZhbHVlOiBzdHJpbmcgfCBudW1iZXI7XG4gIGhvdXIxMj86IGJvb2xlYW47XG59O1xudHlwZSBGb3JtYXQgPSBGb3JtYXRQYXJ0W107XG5cbmV4cG9ydCBjbGFzcyBEYXRlVGltZUZvcm1hdHRlciB7XG4gICNmb3JtYXQ6IEZvcm1hdDtcblxuICBjb25zdHJ1Y3Rvcihmb3JtYXRTdHJpbmc6IHN0cmluZywgcnVsZXM6IFJ1bGVbXSA9IGRlZmF1bHRSdWxlcykge1xuICAgIGNvbnN0IHRva2VuaXplciA9IG5ldyBUb2tlbml6ZXIocnVsZXMpO1xuICAgIHRoaXMuI2Zvcm1hdCA9IHRva2VuaXplci50b2tlbml6ZShcbiAgICAgIGZvcm1hdFN0cmluZyxcbiAgICAgICh7IHR5cGUsIHZhbHVlLCBob3VyMTIgfSkgPT4ge1xuICAgICAgICBjb25zdCByZXN1bHQgPSB7XG4gICAgICAgICAgdHlwZSxcbiAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgfSBhcyB1bmtub3duIGFzIFJlY2VpdmVyUmVzdWx0O1xuICAgICAgICBpZiAoaG91cjEyKSByZXN1bHQuaG91cjEyID0gaG91cjEyIGFzIGJvb2xlYW47XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9LFxuICAgICkgYXMgRm9ybWF0O1xuICB9XG5cbiAgZm9ybWF0KGRhdGU6IERhdGUsIG9wdGlvbnM6IE9wdGlvbnMgPSB7fSk6IHN0cmluZyB7XG4gICAgbGV0IHN0cmluZyA9IFwiXCI7XG5cbiAgICBjb25zdCB1dGMgPSBvcHRpb25zLnRpbWVab25lID09PSBcIlVUQ1wiO1xuXG4gICAgZm9yIChjb25zdCB0b2tlbiBvZiB0aGlzLiNmb3JtYXQpIHtcbiAgICAgIGNvbnN0IHR5cGUgPSB0b2tlbi50eXBlO1xuXG4gICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSBcInllYXJcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gdXRjID8gZGF0ZS5nZXRVVENGdWxsWWVhcigpIDogZGF0ZS5nZXRGdWxsWWVhcigpO1xuICAgICAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6IHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IHZhbHVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCIyLWRpZ2l0XCI6IHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IGRpZ2l0cyh2YWx1ZSwgMikuc2xpY2UoLTIpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgIGBGb3JtYXR0ZXJFcnJvcjogdmFsdWUgXCIke3Rva2VuLnZhbHVlfVwiIGlzIG5vdCBzdXBwb3J0ZWRgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwibW9udGhcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gKHV0YyA/IGRhdGUuZ2V0VVRDTW9udGgoKSA6IGRhdGUuZ2V0TW9udGgoKSkgKyAxO1xuICAgICAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6IHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IHZhbHVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCIyLWRpZ2l0XCI6IHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IGRpZ2l0cyh2YWx1ZSwgMik7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgICAgICAgYEZvcm1hdHRlckVycm9yOiB2YWx1ZSBcIiR7dG9rZW4udmFsdWV9XCIgaXMgbm90IHN1cHBvcnRlZGAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJkYXlcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gdXRjID8gZGF0ZS5nZXRVVENEYXRlKCkgOiBkYXRlLmdldERhdGUoKTtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSB2YWx1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSBkaWdpdHModmFsdWUsIDIpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgIGBGb3JtYXR0ZXJFcnJvcjogdmFsdWUgXCIke3Rva2VuLnZhbHVlfVwiIGlzIG5vdCBzdXBwb3J0ZWRgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiaG91clwiOiB7XG4gICAgICAgICAgbGV0IHZhbHVlID0gdXRjID8gZGF0ZS5nZXRVVENIb3VycygpIDogZGF0ZS5nZXRIb3VycygpO1xuICAgICAgICAgIHZhbHVlIC09IHRva2VuLmhvdXIxMiAmJiBkYXRlLmdldEhvdXJzKCkgPiAxMiA/IDEyIDogMDtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSB2YWx1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSBkaWdpdHModmFsdWUsIDIpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgIGBGb3JtYXR0ZXJFcnJvcjogdmFsdWUgXCIke3Rva2VuLnZhbHVlfVwiIGlzIG5vdCBzdXBwb3J0ZWRgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwibWludXRlXCI6IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IHV0YyA/IGRhdGUuZ2V0VVRDTWludXRlcygpIDogZGF0ZS5nZXRNaW51dGVzKCk7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICBzdHJpbmcgKz0gdmFsdWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIjItZGlnaXRcIjoge1xuICAgICAgICAgICAgICBzdHJpbmcgKz0gZGlnaXRzKHZhbHVlLCAyKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgRm9ybWF0dGVyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcInNlY29uZFwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSB1dGMgPyBkYXRlLmdldFVUQ1NlY29uZHMoKSA6IGRhdGUuZ2V0U2Vjb25kcygpO1xuICAgICAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6IHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IHZhbHVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCIyLWRpZ2l0XCI6IHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IGRpZ2l0cyh2YWx1ZSwgMik7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgICAgICAgYEZvcm1hdHRlckVycm9yOiB2YWx1ZSBcIiR7dG9rZW4udmFsdWV9XCIgaXMgbm90IHN1cHBvcnRlZGAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJmcmFjdGlvbmFsU2Vjb25kXCI6IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IHV0Y1xuICAgICAgICAgICAgPyBkYXRlLmdldFVUQ01pbGxpc2Vjb25kcygpXG4gICAgICAgICAgICA6IGRhdGUuZ2V0TWlsbGlzZWNvbmRzKCk7XG4gICAgICAgICAgc3RyaW5nICs9IGRpZ2l0cyh2YWx1ZSwgTnVtYmVyKHRva2VuLnZhbHVlKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgLy8gRklYTUUoYmFydGxvbWllanUpXG4gICAgICAgIGNhc2UgXCJ0aW1lWm9uZU5hbWVcIjoge1xuICAgICAgICAgIC8vIHN0cmluZyArPSB1dGMgPyBcIlpcIiA6IHRva2VuLnZhbHVlXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImRheVBlcmlvZFwiOiB7XG4gICAgICAgICAgc3RyaW5nICs9IHRva2VuLnZhbHVlID8gKGRhdGUuZ2V0SG91cnMoKSA+PSAxMiA/IFwiUE1cIiA6IFwiQU1cIikgOiBcIlwiO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJsaXRlcmFsXCI6IHtcbiAgICAgICAgICBzdHJpbmcgKz0gdG9rZW4udmFsdWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IEVycm9yKGBGb3JtYXR0ZXJFcnJvcjogeyAke3Rva2VuLnR5cGV9ICR7dG9rZW4udmFsdWV9IH1gKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc3RyaW5nO1xuICB9XG5cbiAgcGFyc2VUb1BhcnRzKHN0cmluZzogc3RyaW5nKTogRGF0ZVRpbWVGb3JtYXRQYXJ0W10ge1xuICAgIGNvbnN0IHBhcnRzOiBEYXRlVGltZUZvcm1hdFBhcnRbXSA9IFtdO1xuXG4gICAgZm9yIChjb25zdCB0b2tlbiBvZiB0aGlzLiNmb3JtYXQpIHtcbiAgICAgIGNvbnN0IHR5cGUgPSB0b2tlbi50eXBlO1xuXG4gICAgICBsZXQgdmFsdWUgPSBcIlwiO1xuICAgICAgc3dpdGNoICh0b2tlbi50eXBlKSB7XG4gICAgICAgIGNhc2UgXCJ5ZWFyXCI6IHtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7MSw0fS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCIyLWRpZ2l0XCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlxcZHsxLDJ9Ly5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwibW9udGhcIjoge1xuICAgICAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlxcZHsxLDJ9Ly5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIjItZGlnaXRcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezJ9Ly5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIm5hcnJvd1wiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15bYS16QS1aXSsvLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwic2hvcnRcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eW2EtekEtWl0rLy5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcImxvbmdcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eW2EtekEtWl0rLy5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgICAgICAgYFBhcnNlckVycm9yOiB2YWx1ZSBcIiR7dG9rZW4udmFsdWV9XCIgaXMgbm90IHN1cHBvcnRlZGAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJkYXlcIjoge1xuICAgICAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlxcZHsxLDJ9Ly5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIjItZGlnaXRcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezJ9Ly5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgICAgICAgYFBhcnNlckVycm9yOiB2YWx1ZSBcIiR7dG9rZW4udmFsdWV9XCIgaXMgbm90IHN1cHBvcnRlZGAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJob3VyXCI6IHtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7MSwyfS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBpZiAodG9rZW4uaG91cjEyICYmIHBhcnNlSW50KHZhbHVlKSA+IDEyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgICAgICAgIGBUcnlpbmcgdG8gcGFyc2UgaG91ciBncmVhdGVyIHRoYW4gMTIuIFVzZSAnSCcgaW5zdGVhZCBvZiAnaCcuYCxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIjItZGlnaXRcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezJ9Ly5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGlmICh0b2tlbi5ob3VyMTIgJiYgcGFyc2VJbnQodmFsdWUpID4gMTIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICAgICAgICAgYFRyeWluZyB0byBwYXJzZSBob3VyIGdyZWF0ZXIgdGhhbiAxMi4gVXNlICdISCcgaW5zdGVhZCBvZiAnaGgnLmAsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgIGBQYXJzZXJFcnJvcjogdmFsdWUgXCIke3Rva2VuLnZhbHVlfVwiIGlzIG5vdCBzdXBwb3J0ZWRgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwibWludXRlXCI6IHtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7MSwyfS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCIyLWRpZ2l0XCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlxcZHsyfS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgIGBQYXJzZXJFcnJvcjogdmFsdWUgXCIke3Rva2VuLnZhbHVlfVwiIGlzIG5vdCBzdXBwb3J0ZWRgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwic2Vjb25kXCI6IHtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7MSwyfS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCIyLWRpZ2l0XCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlxcZHsyfS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgIGBQYXJzZXJFcnJvcjogdmFsdWUgXCIke3Rva2VuLnZhbHVlfVwiIGlzIG5vdCBzdXBwb3J0ZWRgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZnJhY3Rpb25hbFNlY29uZFwiOiB7XG4gICAgICAgICAgdmFsdWUgPSBuZXcgUmVnRXhwKGBeXFxcXGR7JHt0b2tlbi52YWx1ZX19YCkuZXhlYyhzdHJpbmcpXG4gICAgICAgICAgICA/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcInRpbWVab25lTmFtZVwiOiB7XG4gICAgICAgICAgdmFsdWUgPSB0b2tlbi52YWx1ZSBhcyBzdHJpbmc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImRheVBlcmlvZFwiOiB7XG4gICAgICAgICAgdmFsdWUgPSAvXihBfFApTS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJsaXRlcmFsXCI6IHtcbiAgICAgICAgICBpZiAoIXN0cmluZy5zdGFydHNXaXRoKHRva2VuLnZhbHVlIGFzIHN0cmluZykpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICBgTGl0ZXJhbCBcIiR7dG9rZW4udmFsdWV9XCIgbm90IGZvdW5kIFwiJHtzdHJpbmcuc2xpY2UoMCwgMjUpfVwiYCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhbHVlID0gdG9rZW4udmFsdWUgYXMgc3RyaW5nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBFcnJvcihgJHt0b2tlbi50eXBlfSAke3Rva2VuLnZhbHVlfWApO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgIGB2YWx1ZSBub3QgdmFsaWQgZm9yIHRva2VuIHsgJHt0eXBlfSAke3ZhbHVlfSB9ICR7XG4gICAgICAgICAgICBzdHJpbmcuc2xpY2UoXG4gICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgIDI1LFxuICAgICAgICAgICAgKVxuICAgICAgICAgIH1gLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgcGFydHMucHVzaCh7IHR5cGUsIHZhbHVlIH0pO1xuXG4gICAgICBzdHJpbmcgPSBzdHJpbmcuc2xpY2UodmFsdWUubGVuZ3RoKTtcbiAgICB9XG5cbiAgICBpZiAoc3RyaW5nLmxlbmd0aCkge1xuICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgIGBkYXRldGltZSBzdHJpbmcgd2FzIG5vdCBmdWxseSBwYXJzZWQhICR7c3RyaW5nLnNsaWNlKDAsIDI1KX1gLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFydHM7XG4gIH1cblxuICAvKiogc29ydCAmIGZpbHRlciBkYXRlVGltZUZvcm1hdFBhcnQgKi9cbiAgc29ydERhdGVUaW1lRm9ybWF0UGFydChwYXJ0czogRGF0ZVRpbWVGb3JtYXRQYXJ0W10pOiBEYXRlVGltZUZvcm1hdFBhcnRbXSB7XG4gICAgbGV0IHJlc3VsdDogRGF0ZVRpbWVGb3JtYXRQYXJ0W10gPSBbXTtcbiAgICBjb25zdCB0eXBlQXJyYXkgPSBbXG4gICAgICBcInllYXJcIixcbiAgICAgIFwibW9udGhcIixcbiAgICAgIFwiZGF5XCIsXG4gICAgICBcImhvdXJcIixcbiAgICAgIFwibWludXRlXCIsXG4gICAgICBcInNlY29uZFwiLFxuICAgICAgXCJmcmFjdGlvbmFsU2Vjb25kXCIsXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IHR5cGUgb2YgdHlwZUFycmF5KSB7XG4gICAgICBjb25zdCBjdXJyZW50ID0gcGFydHMuZmluZEluZGV4KChlbCkgPT4gZWwudHlwZSA9PT0gdHlwZSk7XG4gICAgICBpZiAoY3VycmVudCAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChwYXJ0cy5zcGxpY2UoY3VycmVudCwgMSkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KHBhcnRzKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcGFydHNUb0RhdGUocGFydHM6IERhdGVUaW1lRm9ybWF0UGFydFtdKTogRGF0ZSB7XG4gICAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgdXRjID0gcGFydHMuZmluZChcbiAgICAgIChwYXJ0KSA9PiBwYXJ0LnR5cGUgPT09IFwidGltZVpvbmVOYW1lXCIgJiYgcGFydC52YWx1ZSA9PT0gXCJVVENcIixcbiAgICApO1xuXG4gICAgY29uc3QgZGF5UGFydCA9IHBhcnRzLmZpbmQoKHBhcnQpID0+IHBhcnQudHlwZSA9PT0gXCJkYXlcIik7XG5cbiAgICB1dGMgPyBkYXRlLnNldFVUQ0hvdXJzKDAsIDAsIDAsIDApIDogZGF0ZS5zZXRIb3VycygwLCAwLCAwLCAwKTtcbiAgICBmb3IgKGNvbnN0IHBhcnQgb2YgcGFydHMpIHtcbiAgICAgIHN3aXRjaCAocGFydC50eXBlKSB7XG4gICAgICAgIGNhc2UgXCJ5ZWFyXCI6IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IE51bWJlcihwYXJ0LnZhbHVlLnBhZFN0YXJ0KDQsIFwiMjBcIikpO1xuICAgICAgICAgIHV0YyA/IGRhdGUuc2V0VVRDRnVsbFllYXIodmFsdWUpIDogZGF0ZS5zZXRGdWxsWWVhcih2YWx1ZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcIm1vbnRoXCI6IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IE51bWJlcihwYXJ0LnZhbHVlKSAtIDE7XG4gICAgICAgICAgaWYgKGRheVBhcnQpIHtcbiAgICAgICAgICAgIHV0Y1xuICAgICAgICAgICAgICA/IGRhdGUuc2V0VVRDTW9udGgodmFsdWUsIE51bWJlcihkYXlQYXJ0LnZhbHVlKSlcbiAgICAgICAgICAgICAgOiBkYXRlLnNldE1vbnRoKHZhbHVlLCBOdW1iZXIoZGF5UGFydC52YWx1ZSkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB1dGMgPyBkYXRlLnNldFVUQ01vbnRoKHZhbHVlKSA6IGRhdGUuc2V0TW9udGgodmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZGF5XCI6IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IE51bWJlcihwYXJ0LnZhbHVlKTtcbiAgICAgICAgICB1dGMgPyBkYXRlLnNldFVUQ0RhdGUodmFsdWUpIDogZGF0ZS5zZXREYXRlKHZhbHVlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiaG91clwiOiB7XG4gICAgICAgICAgbGV0IHZhbHVlID0gTnVtYmVyKHBhcnQudmFsdWUpO1xuICAgICAgICAgIGNvbnN0IGRheVBlcmlvZCA9IHBhcnRzLmZpbmQoXG4gICAgICAgICAgICAocGFydDogRGF0ZVRpbWVGb3JtYXRQYXJ0KSA9PiBwYXJ0LnR5cGUgPT09IFwiZGF5UGVyaW9kXCIsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAoZGF5UGVyaW9kPy52YWx1ZSA9PT0gXCJQTVwiKSB2YWx1ZSArPSAxMjtcbiAgICAgICAgICB1dGMgPyBkYXRlLnNldFVUQ0hvdXJzKHZhbHVlKSA6IGRhdGUuc2V0SG91cnModmFsdWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJtaW51dGVcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gTnVtYmVyKHBhcnQudmFsdWUpO1xuICAgICAgICAgIHV0YyA/IGRhdGUuc2V0VVRDTWludXRlcyh2YWx1ZSkgOiBkYXRlLnNldE1pbnV0ZXModmFsdWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJzZWNvbmRcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gTnVtYmVyKHBhcnQudmFsdWUpO1xuICAgICAgICAgIHV0YyA/IGRhdGUuc2V0VVRDU2Vjb25kcyh2YWx1ZSkgOiBkYXRlLnNldFNlY29uZHModmFsdWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJmcmFjdGlvbmFsU2Vjb25kXCI6IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IE51bWJlcihwYXJ0LnZhbHVlKTtcbiAgICAgICAgICB1dGMgPyBkYXRlLnNldFVUQ01pbGxpc2Vjb25kcyh2YWx1ZSkgOiBkYXRlLnNldE1pbGxpc2Vjb25kcyh2YWx1ZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRhdGU7XG4gIH1cblxuICBwYXJzZShzdHJpbmc6IHN0cmluZyk6IERhdGUge1xuICAgIGNvbnN0IHBhcnRzID0gdGhpcy5wYXJzZVRvUGFydHMoc3RyaW5nKTtcbiAgICBjb25zdCBzb3J0UGFydHMgPSB0aGlzLnNvcnREYXRlVGltZUZvcm1hdFBhcnQocGFydHMpO1xuICAgIHJldHVybiB0aGlzLnBhcnRzVG9EYXRlKHNvcnRQYXJ0cyk7XG4gIH1cbn1cbiJdfQ==