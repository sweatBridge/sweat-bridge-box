import DatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { Gradients } from '../constants/gradients';
import { AppColors } from '../constants/colors';

registerLocale('ko', ko);

interface DateInputProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  isBirthDate?: boolean;
}

const DateInput = ({
  selected,
  onChange,
  disabled = false,
  placeholder = '날짜 선택',
  className = 'form-input',
  minDate,
  maxDate,
  isBirthDate = false
}: DateInputProps) => {
  const defaultMinDate = isBirthDate ? new Date(1900, 0, 1) : new Date(2000, 0, 1);
  const defaultMaxDate = new Date(2999, 11, 31);

  return (
    <>
      <DatePicker
        selected={selected}
        onChange={onChange}
        dateFormat="yyyy-MM-dd"
        locale="ko"
        disabled={disabled}
        placeholderText={placeholder}
        className={className}
        minDate={minDate ?? defaultMinDate}
        maxDate={maxDate ?? defaultMaxDate}
        showYearDropdown
        showMonthDropdown
        dropdownMode="select"
        yearDropdownItemNumber={100}
        scrollableYearDropdown
        autoComplete="off"
      />
      <style>{`
        .react-datepicker-wrapper {
          width: 100%;
        }

        .react-datepicker__input-container {
          width: 100%;
        }

        .react-datepicker__input-container input {
          width: 100%;
          box-sizing: border-box;
        }

        .react-datepicker {
          font-family: inherit;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .react-datepicker__header {
          background: ${Gradients.primary};
          border-bottom: none;
          border-radius: 8px 8px 0 0;
          padding: 12px;
        }

        .react-datepicker__current-month {
          color: white;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .react-datepicker__day-names {
          margin-top: 8px;
        }

        .react-datepicker__day-name {
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
          width: 36px;
          line-height: 36px;
          margin: 2px;
        }

        .react-datepicker__month {
          margin: 8px;
        }

        .react-datepicker__day {
          width: 36px;
          line-height: 36px;
          margin: 2px;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .react-datepicker__day:hover {
          background-color: #dbeafe;
          border-radius: 50%;
        }

        .react-datepicker__day--selected {
          background: ${Gradients.primary};
          border-radius: 50%;
          font-weight: 600;
        }

        .react-datepicker__day--selected:hover {
          background: ${Gradients.primaryHover};
        }

        .react-datepicker__day--keyboard-selected {
          background-color: #dbeafe;
          border-radius: 50%;
        }

        .react-datepicker__day--today {
          font-weight: 600;
          color: ${AppColors.primary};
        }

        .react-datepicker__day--outside-month {
          color: #9ca3af;
        }

        .react-datepicker__navigation {
          top: 12px;
        }

        .react-datepicker__navigation-icon::before {
          border-color: white;
        }

        .react-datepicker__navigation:hover *::before {
          border-color: rgba(255, 255, 255, 0.7);
        }

        .react-datepicker__year-dropdown,
        .react-datepicker__month-dropdown {
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .react-datepicker__year-option,
        .react-datepicker__month-option {
          padding: 6px 12px;
          transition: background-color 0.2s;
        }

        .react-datepicker__year-option:hover,
        .react-datepicker__month-option:hover {
          background-color: #dbeafe;
        }

        .react-datepicker__year-option--selected,
        .react-datepicker__month-option--selected {
          background-color: ${AppColors.primary};
          color: white;
        }

        .react-datepicker__year-read-view,
        .react-datepicker__month-read-view {
          color: white;
          visibility: visible !important;
        }

        .react-datepicker__year-read-view--down-arrow,
        .react-datepicker__month-read-view--down-arrow {
          border-color: white;
          border-width: 2px 2px 0 0;
        }

        .react-datepicker__header__dropdown {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 4px;
        }

        .react-datepicker__year-dropdown-container,
        .react-datepicker__month-dropdown-container {
          margin: 0;
        }

        .react-datepicker__triangle {
          display: none;
        }
      `}</style>
    </>
  );
};

export default DateInput;
