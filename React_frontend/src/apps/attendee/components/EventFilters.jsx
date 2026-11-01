import React from 'react';

export default function EventFilters({
  query,
  category,
  price,
  city,
  categories,
  cities,
  onQueryChange,
  onCategoryChange,
  onPriceChange,
  onCityChange,
}) {
  return (
    <div className="filter-row">
      <div className="search-box input-group">
        <span className="input-icon">🔍</span>
        <input
          className="form-control"
          id="be-q"
          placeholder="Search events…"
          value={query}
          onChange={event => onQueryChange(event.target.value)}
        />
      </div>
      <select
        className="form-control filter-select"
        id="be-cat"
        value={category}
        onChange={event => onCategoryChange(event.target.value)}
      >
        <option value="">All Categories</option>
        {categories.map(item => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <select
        className="form-control filter-select"
        id="be-price"
        value={price}
        onChange={event => onPriceChange(event.target.value)}
      >
        <option value="">Any Price</option>
        <option value="free">Free Only</option>
        <option value="paid">Paid Only</option>
      </select>
      <select
        className="form-control filter-select"
        id="be-city"
        value={city}
        onChange={event => onCityChange(event.target.value)}
      >
        <option value="">Any City</option>
        {cities.map(item => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </div>
  );
}
