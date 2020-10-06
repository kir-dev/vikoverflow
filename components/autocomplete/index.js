import Select from "react-select/creatable";
import Label from "components/label";
import Error from "components/error";
import moduleStyles from "./autocomplete.module.css";
import { ChevronDown } from "react-feather";
import { Fragment } from "react";

export default function Autocomplete({
  value,
  onChange,
  onBlur,
  options,
  disabled,
  error,
  onCreate,
  placeholder,
  noOptionsMessage,
  formatCreateLabel,
  label,
}) {
  const Wrapper = label ? Label : Fragment;
  const wrapperProps = label ? { value: label } : {};

  return (
    <Wrapper {...wrapperProps}>
      <Select
        value={value}
        onChange={onChange}
        options={options}
        onCreateOption={onCreate}
        isDisabled={disabled}
        onBlur={onBlur}
        placeholder={placeholder}
        formatCreateLabel={formatCreateLabel}
        noOptionsMessage={noOptionsMessage}
        styles={styles}
        error={error}
        maxMenuHeight={200}
        components={{
          DropdownIndicator: () => <ChevronDown strokeWidth={1} size={18} />,
        }}
      />
      {error && (
        <div className={moduleStyles.errorRoot}>
          <Error>{error}</Error>
        </div>
      )}
    </Wrapper>
  );
}

// CSS-in-JS is a beauty, isn't it? :)

const styles = {
  container: (provided) => ({
    ...provided,
    pointerEvents: "unset",
    font: "inherit",
  }),
  control: (provided, state) => ({
    ...provided,
    font: "inherit",
    border: `1px solid ${
      state.selectProps.error
        ? "var(--error)"
        : state.isFocused && !state.isDisabled
        ? "var(--foreground)"
        : "var(--accent-2)"
    }`,
    height: 35,
    minHeight: "unset",
    color: state?.selectProps?.error
      ? "var(--error) !important"
      : state.isDisabled
      ? "var(--accent-4)"
      : "var(--foreground)",
    borderRadius: "var(--radius)",
    boxShadow: "none",
    "&:hover": {
      // intentionally empty
    },
    cursor: state.isDisabled ? "not-allowed" : "unset",
    background: state.isDisabled ? "var(--accent-1)" : "var(--background)",
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "0 0 0 calc(0.75rem - 2px)",
  }),
  indicatorSeparator: () => ({ display: "none" }),
  indicatorsContainer: (provided) => ({
    ...provided,
    color: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "4px",
    width: 24,
    padding: 0,
  }),
  singleValue: (provided) => ({
    ...provided,
    font: "inherit",
    color: "inherit",
  }),
  placeholder: (provided, state) => ({
    ...provided,
    font: "inherit",
    color: state?.selectProps?.error
      ? "var(--input-errored-placeholder-color)"
      : "var(--accent-4)",
  }),
  input: (provided) => ({
    ...provided,
    font: "inherit",
    color: "inherit",
    "& input": {
      font: "inherit",
    },
  }),
  menu: (provided) => ({
    ...provided,
    background: "var(--background)",
    borderRadius: "var(--radius)",
    boxShadow: "0 1px 8px 0 rgba(0,0,0,.08), 0 0 1px 0 rgba(0,0,0,.3);",
    border: "none",
    lineHeight: 1,
    overflow: "hidden",
    font: "inherit",
    margin: "4px 0 0 0",
  }),
  option: (provided, state) => ({
    ...provided,
    color: "inherit",
    padding: "0 10px",
    minHeight: 32,
    display: "flex",
    alignItems: "center",
    fontSize: "inherit",
    lineHeight: "inherit",
    background: state.isFocused || state.isSelected ? "#f3f3f3" : "transparent",
    "&:hover": {
      background: "var(--accent-2)",
    },
    cursor: "pointer",
  }),
  noOptionsMessage: (provided) => ({
    ...provided,
    color: "inherit",
    minHeight: 32,
    padding: "0 10px",
    display: "flex",
    alignItems: "center",
    fontSize: "inherit",
    lineHeight: "inherit",
    textAlign: "left",
  }),
};
