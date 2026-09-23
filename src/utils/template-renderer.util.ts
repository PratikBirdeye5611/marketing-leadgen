import { isNotBlank } from './string.util';

function getTemplateValue(templateObject: Record<string, any>, getter: string): string {
  const prop = getter.replace(/^get/, '');
  const key = prop.charAt(0).toLowerCase() + prop.slice(1);
  const value = templateObject[key];
  return value === undefined || value === null ? '' : String(value);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function renderCalendarBookingTemplate(
  template: string,
  templateObject: Record<string, any>,
  templateVarName: string = 'CALENDAR_BOOKING_TEMPLATE',
): string {
  if (!template) return '';

  const varName = escapeRegExp(templateVarName);
  let result = template;

  result = result.replace(
    new RegExp(`<#if\\s+${varName}\\.(get\\w+)\\(\\)\\?\\?>([\\s\\S]*?)<\\/#if>`, 'g'),
    (_m, getter: string, inner: string) =>
      isNotBlank(getTemplateValue(templateObject, getter)) ? inner : '',
  );

  result = result.replace(
    new RegExp(`\\$\\{\\(${varName}\\.(get\\w+)\\(\\)!"([^"]*)"\\)\\?capitalize\\}`, 'g'),
    (_m, getter: string, fallback: string) => {
      const value = getTemplateValue(templateObject, getter) || fallback;
      return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
    },
  );

  result = result.replace(
    new RegExp(`\\$\\{${varName}\\.(get\\w+)\\(\\)!"([^"]*)"\\}`, 'g'),
    (_m, getter: string, fallback: string) => {
      const value = getTemplateValue(templateObject, getter);
      return isNotBlank(value) ? value : fallback;
    },
  );

  result = result.replace(
    new RegExp(`\\$\\{${varName}\\.(get\\w+)\\(\\)\\}`, 'g'),
    (_m, getter: string) => getTemplateValue(templateObject, getter),
  );

  return result;
}