import Select from "react-select/creatable";
import LoadingDots from "components/loading-dots";
import Label from "components/label";
import Error from "components/error";
import moduleStyles from "./autocomplete.module.css";
import { ChevronDown } from "react-feather";

export default function Autocomplete({
  value,
  onChange,
  onBlur,
  options,
  disabled,
  error,
  loading,
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
        isDisabled={disabled || loading}
        isLoading={loading}
        onBlur={onBlur}
        placeholder={placeholder}
        formatCreateLabel={formatCreateLabel}
        noOptionsMessage={noOptionsMessage}
        styles={styles}
        error={error}
        maxMenuHeight={200}
        components={{
          DropdownIndicator: () => <ChevronDown strokeWidth={1} size={18} />,
          LoadingIndicator: () => (
            <div style={{ padding: "0 1rem" }}>
              <LoadingDots />
            </div>
          ),
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

const styles = {
  container: (provided) => ({
    ...provided,
    pointerEvents: "unset",
  }),
  control: (provided, state) => ({
    ...provided,
    transition: "color 200ms ease, border-color 200ms ease",
    border: `1px solid ${
      state.selectProps.error
        ? "var(--error)"
        : state.isFocused && !state.isDisabled
        ? "var(--foreground)"
        : "var(--accent-2)"
    }`,
    height: "2.5rem",
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
  placeholder: (provided) => ({ ...provided, color: "var(--accent-4)" }),
  indicatorsContainer: (provided) => ({
    ...provided,
    color: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 0.75rem",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "inherit",
  }),
  input: (provided) => ({
    ...provided,
    color: "inherit",
  }),
  menu: (provided) => ({
    ...provided,
    background: "var(--background)",
    borderRadius: "var(--radius)",
    boxShadow: "var(--shadow)",
    border: "none",
    lineHeight: 1,
    overflow: "hidden",
  }),
  option: (provided, state) => ({
    ...provided,
    color: "inherit",
    padding: "0.75rem",
    fontSize: "inherit",
    lineHeight: "inherit",
    background: state.isFocused
      ? "var(--accent-1)"
      : state.isSelected
      ? "var(--accent-2)"
      : "transparent",
    "&:hover": {
      background: "var(--accent-2)",
    },
    cursor: "pointer",
  }),
  noOptionsMessage: (provided) => ({
    ...provided,
    color: "inherit",
    padding: "0.75rem",
    fontSize: "inherit",
    lineHeight: "inherit",
  }),
};
