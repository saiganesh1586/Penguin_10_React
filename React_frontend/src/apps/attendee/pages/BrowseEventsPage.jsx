import React, { useMemo, useState } from 'react';
import EventCard from '../components/EventCard.jsx';
import EventFilters from '../components/EventFilters.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/PageFeedback.jsx';
import { compareNewestFirst } from '../../../app/record-order.js';

export default function BrowseEventsPage({
  events = [],
  registrations = [],
  loading = false,
  error = '',
  onRetry,
  onRegister,
  onViewEvent,
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('');

  const available = useMemo(() => {
    const registered = new Set(
      registrations.filter(item => item.status !== 'cancelled').map(item => String(item.eventId))
    );
    return events
      .filter(
        item =>
          !['completed', 'cancelled'].includes(item.status) &&
          new Date(`${item.date}T23:59:59`) >= new Date() &&
          !registered.has(String(item.id || item.eventId))
      )
      .sort(compareNewestFirst);
  }, [events, registrations]);

  const categories = useMemo(
    () => [...new Set(available.map(item => item.category).filter(Boolean))].sort(),
    [available]
  );
  const cities = useMemo(
    () => [...new Set(available.map(item => item.city).filter(Boolean))],
    [available]
  );
  const filtered = useMemo(
    () =>
      available.filter(
        item =>
          (!query || item.title?.toLowerCase().includes(query.toLowerCase())) &&
          (!category || item.category === category) &&
          (!price || (price === 'free' ? Number(item.price) === 0 : Number(item.price) > 0)) &&
          (!city || item.city === city)
      ),
    [available, query, category, price, city]
  );

  if (loading) return <LoadingState icon="📅" title="Loading events…" />;
  if (error)
    return (
      <>
        <PageHeader title="Browse Events" subtitle="Discover and register for upcoming events." />
        <ErrorState title="Events could not be loaded" message={error} onRetry={onRetry} />
      </>
    );

  return (
    <>
      <PageHeader title="Browse Events" subtitle="Discover and register for new upcoming events." />
      <EventFilters
        query={query}
        category={category}
        price={price}
        city={city}
        categories={categories}
        cities={cities}
        onQueryChange={setQuery}
        onCategoryChange={setCategory}
        onPriceChange={setPrice}
        onCityChange={setCity}
      />
      <div className="events-grid" id="browse-grid">
        {filtered.length ? (
          filtered.map(item => (
            <EventCard
              key={item.id || item.eventId}
              event={item}
              onRegister={onRegister}
              onViewEvent={onViewEvent}
            />
          ))
        ) : (
          <EmptyState
            icon={available.length ? '🔍' : '📅'}
            title={available.length ? 'No events match' : 'No new upcoming events'}
            description={
              available.length
                ? 'Try adjusting your filters.'
                : 'Your registrations are in My Tickets. Check back soon for new events.'
            }
            style={{ gridColumn: '1/-1' }}
          />
        )}
      </div>
    </>
  );
}
