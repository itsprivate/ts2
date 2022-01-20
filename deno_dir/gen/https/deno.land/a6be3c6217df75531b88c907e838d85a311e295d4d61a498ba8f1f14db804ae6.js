function extractPrettyTimezone(date) {
    const res = /\((.*)\)/.exec(date.toString());
    if (!res)
        throw new Error(`A weird error occurred whilst getting the timezone`);
    return res[1];
}
function negativeOrPositiveSign(num) {
    if (num >= 0)
        return '+' + num;
    return String(num);
}
const getYear = (date) => date.getFullYear();
const getMonth = (date) => [`Jan`, `Feb`, `Mar`, `Apr`, `May`, `Jun`, `Jul`, `Aug`, `Sep`, `Nov`, `Dec`][date.getMonth()];
const getDate = (date) => date.getDate();
const getWeekday = (date) => [`Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`][date.getDay()];
const getAMP = (date) => (date.getHours() >= 12 ? 'PM' : 'AM');
const getHours = (date) => (date.getHours() > 12 ? date.getHours() - 12 : date.getHours());
const getMinutes = (date) => date.getMinutes();
const getSeconds = (date) => date.getSeconds();
const getMilliseconds = (date) => date.getMilliseconds();
const getTimezone = (date) => `${extractPrettyTimezone(date)} (GMT${negativeOrPositiveSign(date.getTimezoneOffset())}min)`;
export function getDateFormat(date, format) {
    switch (format) {
        case 'year':
            return `${getYear(date)} ${getTimezone(date)}`;
        case 'month':
            return `${getMonth(date)} ${getYear(date)} ${getTimezone(date)}`;
        case 'day':
            return `${getWeekday(date)} ${getMonth(date)} ${getDate(date)} ${getYear(date)} ${getTimezone(date)}`;
        case 'hour':
            return `${getWeekday(date)} ${getMonth(date)} ${getDate(date)} ${getYear(date)} ${getHours(date)} ${getAMP(date)} ${getTimezone(date)}`;
        case 'minute':
            return `${getWeekday(date)} ${getMonth(date)} ${getDate(date)} ${getYear(date)} ${getHours(date)}:${getMinutes(date)} ${getAMP(date)} ${getTimezone(date)}`;
        case 'second':
            return `${getWeekday(date)} ${getMonth(date)} ${getDate(date)} ${getYear(date)} ${getHours(date)}:${getMinutes(date)}:${getSeconds(date)} ${getAMP(date)} ${getTimezone(date)}`;
        case 'log':
            return `${getWeekday(date)} ${getMonth(date)} ${getDate(date)} ${getYear(date)} ${getHours(date)}:${getMinutes(date)}:${getSeconds(date)}:${getMilliseconds(date)} ${getAMP(date)} ${getTimezone(date)}`;
        default:
            return ``;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LWRhdGUtZm9ybWF0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2V0LWRhdGUtZm9ybWF0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLFNBQVMscUJBQXFCLENBQUMsSUFBVTtJQUN4QyxNQUFNLEdBQUcsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO0lBQzVDLElBQUksQ0FBQyxHQUFHO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxvREFBb0QsQ0FBQyxDQUFBO0lBQy9FLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ2QsQ0FBQztBQUVELFNBQVMsc0JBQXNCLENBQUMsR0FBVztJQUMxQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQUUsT0FBTyxHQUFHLEdBQUcsR0FBRyxDQUFBO0lBQzlCLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQ25CLENBQUM7QUFFRCxNQUFNLE9BQU8sR0FBRyxDQUFDLElBQVUsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2xELE1BQU0sUUFBUSxHQUFHLENBQUMsSUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQTtBQUMvSCxNQUFNLE9BQU8sR0FBRyxDQUFDLElBQVUsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFBO0FBQzlDLE1BQU0sVUFBVSxHQUFHLENBQUMsSUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtB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Q0FBQyxFQUFFLENBQUE7UUFDN0QsS0FBSyxLQUFLO1lBQ1QsT0FBTyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksVUFBVSxDQUM3RyxJQUFJLENBQ0osSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQTtRQUN0RjtZQUNDLE9BQU8sRUFBRSxDQUFBO0tBQ1Y7QUFDRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBNYWtlRmlsZUxvZ2dlck9wdGlvbnMgfSBmcm9tICcuLi90b29scy50cydcblxuZnVuY3Rpb24gZXh0cmFjdFByZXR0eVRpbWV6b25lKGRhdGU6IERhdGUpIHtcblx0Y29uc3QgcmVzID0gL1xcKCguKilcXCkvLmV4ZWMoZGF0ZS50b1N0cmluZygpKVxuXHRpZiAoIXJlcykgdGhyb3cgbmV3IEVycm9yKGBBIHdlaXJkIGVycm9yIG9jY3VycmVkIHdoaWxzdCBnZXR0aW5nIHRoZSB0aW1lem9uZWApXG5cdHJldHVybiByZXNbMV1cbn1cblxuZnVuY3Rpb24gbmVnYXRpdmVPclBvc2l0aXZlU2lnbihudW06IG51bWJlcik6IHN0cmluZyB7XG5cdGlmIChudW0gPj0gMCkgcmV0dXJuICcrJyArIG51bVxuXHRyZXR1cm4gU3RyaW5nKG51bSlcbn1cblxuY29uc3QgZ2V0WWVhciA9IChkYXRlOiBEYXRlKSA9PiBkYXRlLmdldEZ1bGxZZWFyKClcbmNvbnN0IGdldE1vbnRoID0gKGRhdGU6IERhdGUpID0+IFtgSmFuYCwgYEZlYmAsIGBNYXJgLCBgQXByYCwgYE1heWAsIGBKdW5gLCBgSnVsYCwgYEF1Z2AsIGBTZXBgLCBgTm92YCwgYERlY2BdW2RhdGUuZ2V0TW9udGgoKV1cbmNvbnN0IGdldERhdGUgPSAoZGF0ZTogRGF0ZSkgPT4gZGF0ZS5nZXREYXRlKClcbmNvbnN0IGdldFdlZWtkYXkgPSAoZGF0ZTogRGF0ZSkgPT4gW2BNb25gLCBgVHVlYCwgYFdlZGAsIGBUaHVgLCBgRnJpYCwgYFNhdGAsIGBTdW5gXVtkYXRlLmdldERheSgpXVxuY29uc3QgZ2V0QU1QID0gKGRhdGU6IERhdGUpID0+IChkYXRlLmdldEhvdXJzKCkgPj0gMTIgPyAnUE0nIDogJ0FNJylcbmNvbnN0IGdldEhvdXJzID0gKGRhdGU6IERhdGUpID0+IChkYXRlLmdldEhvdXJzKCkgPiAxMiA/IGRhdGUuZ2V0SG91cnMoKSAtIDEyIDogZGF0ZS5nZXRIb3VycygpKVxuY29uc3QgZ2V0TWludXRlcyA9IChkYXRlOiBEYXRlKSA9PiBkYXRlLmdldE1pbnV0ZXMoKVxuY29uc3QgZ2V0U2Vjb25kcyA9IChkYXRlOiBEYXRlKSA9PiBkYXRlLmdldFNlY29uZHMoKVxuY29uc3QgZ2V0TWlsbGlzZWNvbmRzID0gKGRhdGU6IERhdGUpID0+IGRhdGUuZ2V0TWlsbGlzZWNvbmRzKClcbmNvbnN0IGdldFRpbWV6b25lID0gKGRhdGU6IERhdGUpID0+IGAke2V4dHJhY3RQcmV0dHlUaW1lem9uZShkYXRlKX0gKEdNVCR7bmVnYXRpdmVPclBvc2l0aXZlU2lnbihkYXRlLmdldFRpbWV6b25lT2Zmc2V0KCkpfW1pbilgXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREYXRlRm9ybWF0KGRhdGU6IERhdGUsIGZvcm1hdDogTWFrZUZpbGVMb2dnZXJPcHRpb25zWyduZXdMb2dGaWxlRWFjaCddKTogc3RyaW5nIHtcblx0c3dpdGNoIChmb3JtYXQpIHtcblx0XHRjYXNlICd5ZWFyJzpcblx0XHRcdHJldHVybiBgJHtnZXRZZWFyKGRhdGUpfSAke2dldFRpbWV6b25lKGRhdGUpfWBcblx0XHRjYXNlICdtb250aCc6XG5cdFx0XHRyZXR1cm4gYCR7Z2V0TW9udGgoZGF0ZSl9ICR7Z2V0WWVhcihkYXRlKX0gJHtnZXRUaW1lem9uZShkYXRlKX1gXG5cdFx0Y2FzZSAnZGF5Jzpcblx0XHRcdHJldHVybiBgJHtnZXRXZWVrZGF5KGRhdGUpfSAke2dldE1vbnRoKGRhdGUpfSAke2dldERhdGUoZGF0ZSl9ICR7Z2V0WWVhcihkYXRlKX0gJHtnZXRUaW1lem9uZShkYXRlKX1gXG5cdFx0Y2FzZSAnaG91cic6XG5cdFx0XHRyZXR1cm4gYCR7Z2V0V2Vla2RheShkYXRlKX0gJHtnZXRNb250aChkYXRlKX0gJHtnZXREYXRlKGRhdGUpfSAke2dldFllYXIoZGF0ZSl9ICR7Z2V0SG91cnMoZGF0ZSl9ICR7Z2V0QU1QKGRhdGUpfSAke2dldFRpbWV6b25lKFxuXHRcdFx0XHRkYXRlXG5cdFx0XHQpfWBcblx0XHRjYXNlICdtaW51dGUnOlxuXHRcdFx0cmV0dXJuIGAke2dldFdlZWtkYXkoZGF0ZSl9ICR7Z2V0TW9udGgoZGF0ZSl9ICR7Z2V0RGF0ZShkYXRlKX0gJHtnZXRZZWFyKGRhdGUpfSAke2dldEhvdXJzKGRhdGUpfToke2dldE1pbnV0ZXMoZGF0ZSl9ICR7Z2V0QU1QKFxuXHRcdFx0XHRkYXRlXG5cdFx0XHQpfSAke2dldFRpbWV6b25lKGRhdGUpfWBcblx0XHRjYXNlICdzZWNvbmQnOlxuXHRcdFx0cmV0dXJuIGAke2dldFdlZWtkYXkoZGF0ZSl9ICR7Z2V0TW9udGgoZGF0ZSl9ICR7Z2V0RGF0ZShkYXRlKX0gJHtnZXRZZWFyKGRhdGUpfSAke2dldEhvdXJzKGRhdGUpfToke2dldE1pbnV0ZXMoXG5cdFx0XHRcdGRhdGVcblx0XHRcdCl9OiR7Z2V0U2Vjb25kcyhkYXRlKX0gJHtnZXRBTVAoZGF0ZSl9ICR7Z2V0VGltZXpvbmUoZGF0ZSl9YFxuXHRcdGNhc2UgJ2xvZyc6XG5cdFx0XHRyZXR1cm4gYCR7Z2V0V2Vla2RheShkYXRlKX0gJHtnZXRNb250aChkYXRlKX0gJHtnZXREYXRlKGRhdGUpfSAke2dldFllYXIoZGF0ZSl9ICR7Z2V0SG91cnMoZGF0ZSl9OiR7Z2V0TWludXRlcyhcblx0XHRcdFx0ZGF0ZVxuXHRcdFx0KX06JHtnZXRTZWNvbmRzKGRhdGUpfToke2dldE1pbGxpc2Vjb25kcyhkYXRlKX0gJHtnZXRBTVAoZGF0ZSl9ICR7Z2V0VGltZXpvbmUoZGF0ZSl9YFxuXHRcdGRlZmF1bHQ6XG5cdFx0XHRyZXR1cm4gYGBcblx0fVxufVxuIl19