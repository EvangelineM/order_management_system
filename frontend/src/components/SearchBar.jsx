const statuses = ["all", "pending", "shipped", "delivered"];

function SearchBar({ onClear, status, onStatusChange }) {
  return (
    <div className="panel admin-form-shell order-search-shell">
      <div className="admin-form-section">
        <div className="order-search-controls">
          <select
            className="order-search-type"
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All Status" : item}
              </option>
            ))}
          </select>
          <button type="button" className="order-clear-btn" onClick={onClear}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

export default SearchBar;
