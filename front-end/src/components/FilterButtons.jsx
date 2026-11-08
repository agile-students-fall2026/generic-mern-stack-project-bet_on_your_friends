// Shared filter buttons keeps the screens styled the same way.
// options contains the button labels and value is the currently selected label.
function FilterButtons({ options, value, onChange, label }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex overflow-x-auto rounded-lg border border-gray-300 bg-white"
    >
      {/* Make one button for each label. The chosen one gets the purple style. */}
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          // onChange tells the page which tab was clicked. Each page decides what to filter.
          //So, the same buttons work for predictions, bets, activity and outcomes.
          onClick={() => onChange(option)}
          className={`min-w-0 flex-1 px-3 py-3 text-sm ${
            value === option
              ? 'bg-nyu-violet font-semibold text-white'
              : 'text-gray-600 hover:bg-nyu-lavender'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

export default FilterButtons
