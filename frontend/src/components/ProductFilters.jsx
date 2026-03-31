import { useEffect, useMemo, useState } from "react";

function ProductFilters({
  products = [],
  filters = {},
  onFilterChange,
  onClearFilters,
}) {
  const priceRange = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 100000 };
    const prices = products.map((p) => Number(p.price) || 0);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [products]);

  const normalizedPriceRange = Array.isArray(filters.priceRange)
    ? [
        Number(filters.priceRange[0] ?? priceRange.min),
        Number(filters.priceRange[1] ?? priceRange.max),
      ]
    : [priceRange.min, priceRange.max];

  // Safe defaults aligned with product dataset
  const safeFilters = {
    metal: Array.isArray(filters.metal) ? filters.metal : [],
    gemstone: Array.isArray(filters.gemstone)
      ? filters.gemstone
          .map((gem) => String(gem).trim())
          .filter((gem) => gem !== "")
      : [],
    minRating: Number(filters.minRating) || 0,
    priceRange: normalizedPriceRange,
  };

  const metalOptions = useMemo(() => {
    const options = new Set();
    products.forEach((product) => {
      if (product?.metal) options.add(product.metal);
    });
    return Array.from(options).sort((a, b) => a.localeCompare(b));
  }, [products]);

  // Show gemstone values and keep "None" as the last option.
  const gemstoneOptions = useMemo(() => {
    const options = new Set();
    let hasNone = false;

    products.forEach((product) => {
      if (product?.gemstone != null && String(product.gemstone).trim() !== "") {
        options.add(product.gemstone);
      } else {
        hasNone = true;
      }
    });

    const sorted = Array.from(options).sort((a, b) => a.localeCompare(b));
    return hasNone ? [...sorted, "None"] : sorted;
  }, [products]);

  const ratingOptions = useMemo(
    () => [
      { value: 4.5, label: "4.5★ & up" },
      { value: 4.0, label: "4.0★ & up" },
      { value: 3.5, label: "3.5★ & up" },
    ],
    [],
  );

  const handleMetalChange = (metal) => {
    const newMetals = safeFilters.metal.includes(metal)
      ? safeFilters.metal.filter((m) => m !== metal)
      : [...safeFilters.metal, metal];

    onFilterChange({ ...safeFilters, metal: newMetals });
  };

  const handleGemstoneChange = (gemstone) => {
    const newGemstones = safeFilters.gemstone.includes(gemstone)
      ? safeFilters.gemstone.filter((g) => g !== gemstone)
      : [...safeFilters.gemstone, gemstone];

    onFilterChange({ ...safeFilters, gemstone: newGemstones });
  };

  const handleRatingChange = (rating) => {
    onFilterChange({
      ...safeFilters,
      minRating: safeFilters.minRating === rating ? 0 : rating,
    });
  };

  const sliderMin = Math.min(0, priceRange.min);
  const sliderMax = Math.max(priceRange.max, sliderMin + 1);

  const selectedMaxPrice = Math.max(
    sliderMin,
    Math.min(Number(safeFilters.priceRange[1]), sliderMax),
  );

  const handleMaxPriceChange = (e) => {
    const value = Number(e.target.value);
    const capped = Math.min(Math.max(value, sliderMin), sliderMax);
    onFilterChange({
      ...safeFilters,
      // Keep min fixed while allowing users to set an upper price cap.
      priceRange: [sliderMin, capped],
    });
  };

  const hasActiveFilters =
    safeFilters.metal.length > 0 ||
    safeFilters.gemstone.length > 0 ||
    safeFilters.minRating > 0 ||
    selectedMaxPrice < sliderMax;

  return (
    <div className="filters-panel">
      <div className="filters-header">
        <h3>Filters</h3>
        {hasActiveFilters && (
          <button
            type="button"
            className="clear-filters-btn"
            onClick={onClearFilters}
          >
            Clear All
          </button>
        )}
      </div>

      {/* METAL */}
      <div className="filter-section">
        <h4>Metal Type</h4>
        <div className="filter-options">
          {metalOptions.map((metal) => (
            <label key={metal} className="filter-checkbox">
              <input
                type="checkbox"
                checked={safeFilters.metal.includes(metal)}
                onChange={() => handleMetalChange(metal)}
              />
              <span>{metal}</span>
            </label>
          ))}
        </div>
      </div>

      {/* GEMSTONE */}
      <div className="filter-section">
        <h4>Gemstone</h4>
        <div className="filter-options">
          {gemstoneOptions.map((gemstone) => (
            <label key={gemstone} className="filter-checkbox">
              <input
                type="checkbox"
                checked={safeFilters.gemstone.includes(gemstone)}
                onChange={() => handleGemstoneChange(gemstone)}
              />
              <span>{gemstone}</span>
            </label>
          ))}
        </div>
      </div>

      {/* RATING */}
      <div className="filter-section">
        <h4>Rating</h4>
        <div className="filter-options">
          {ratingOptions.map((option) => (
            <label key={option.value} className="filter-radio">
              <input
                type="radio"
                name="rating"
                checked={safeFilters.minRating === option.value}
                onChange={() => handleRatingChange(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}

          {/* ALL RATINGS */}
          <label className="filter-radio">
            <input
              type="radio"
              name="rating"
              checked={safeFilters.minRating === 0}
              onChange={() => handleRatingChange(0)}
            />
            <span>All Ratings</span>
          </label>
        </div>
      </div>

      {/* PRICE */}
      <div className="filter-section">
        <h4>Price Range</h4>
        <div className="price-slider-shell">
          <input
            type="range"
            min={sliderMin}
            max={sliderMax}
            step="100"
            value={selectedMaxPrice}
            onChange={handleMaxPriceChange}
            className="price-slider"
            aria-label="Maximum price"
          />
        </div>

        <p className="price-range-display">
          ₹ {Number(sliderMin).toLocaleString("en-IN")} - ₹{" "}
          {Number(selectedMaxPrice).toLocaleString("en-IN")}
        </p>
      </div>
    </div>
  );
}

export default ProductFilters;
