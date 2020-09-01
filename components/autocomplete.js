import Select from "react-select/creatable";
import LoadingDots from "components/loading-dots";

const styles = {
  container: (provided, state) => ({
    ...provided,
    pointerEvents: "unset",
  }),
  control: (provided, state) => ({
    ...provided,
    transition: "color 200ms ease, border-color 200ms ease",
    border: `1px solid ${
      state.selectProps.errored
        ? "var(--error)"
        : state.isFocused && !state.isDisabled
        ? "var(--foreground)"
        : "var(--accent-2)"
    }`,
    height: "2.5rem",
    color: state?.selectProps?.errored
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
  valueContainer: (provided, state) => ({
    ...provided,
    padding: "0 0 0 calc(0.75rem - 2px)",
  }),
  indicatorSeparator: () => ({ display: "none" }),
  placeholder: (provided, state) => ({ ...provided, color: "var(--accent-4)" }),
  indicatorsContainer: (provided, state) => ({
    ...provided,
    color: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 0.75rem",
  }),
  singleValue: (provided, state) => ({
    ...provided,
    color: "inherit",
  }),
  input: (provided, state) => ({
    ...provided,
    color: "inherit",
  }),
  menu: (provided, state) => ({
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
  noOptionsMessage: (provided, state) => ({
    ...provided,
    color: "inherit",
    padding: "0.75rem",
    fontSize: "inherit",
    lineHeight: "inherit",
  }),
};

const Autocomplete = ({
  value,
  onChange,
  onBlur,
  options,
  disabled,
  errored,
  loading,
  onCreate,
  placeholder,
  noOptionsMessage,
  formatCreateLabel,
}) => (
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
    errored={errored}
    maxMenuHeight={200}
    components={{
      DropdownIndicator: () => (
        <svg width="7" height="17" viewBox="0 0 7 12" fill="currentColor">
          <path d="M0.642491 3.35053L0.292945 3.70804L1.00798 4.40714L1.35752 4.04962L0.642491 3.35053ZM3.75752 1.59491L4.10707 1.23739L3.39204 0.538299L3.04249 0.895815L3.75752 1.59491ZM5.58506 4.04651L5.93149 4.40704L6.65256 3.71417L6.30613 3.35364L5.58506 4.04651ZM3.95354 0.9053L3.6071 0.544767L2.88604 1.23763L3.23247 1.59817L3.95354 0.9053ZM1.35752 7.95041L1.00797 7.59289L0.292938 8.29198L0.642485 8.6495L1.35752 7.95041ZM3.04248 11.1042L3.39203 11.4617L4.10706 10.7626L3.75751 10.4051L3.04248 11.1042ZM6.36054 8.64636L6.70697 8.28583L5.98591 7.59296L5.63947 7.95349L6.36054 8.64636ZM3.28688 10.4018L2.94045 10.7624L3.66152 11.4552L4.00795 11.0947L3.28688 10.4018ZM1.35752 4.04962L3.75752 1.59491L3.04249 0.895815L0.642491 3.35053L1.35752 4.04962ZM6.30613 3.35364L3.95354 0.9053L3.23247 1.59817L5.58506 4.04651L6.30613 3.35364ZM0.642485 8.6495L3.04248 11.1042L3.75751 10.4051L1.35752 7.95041L0.642485 8.6495ZM5.63947 7.95349L3.28688 10.4018L4.00795 11.0947L6.36054 8.64636L5.63947 7.95349Z" />
        </svg>
      ),
      LoadingIndicator: () => (
        <div style={{ padding: "0 1rem" }}>
          <LoadingDots />
        </div>
      ),
    }}
  />
);

export default Autocomplete;
