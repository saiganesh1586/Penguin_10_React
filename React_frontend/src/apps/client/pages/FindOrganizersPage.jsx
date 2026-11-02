import HoverCard from '../../../app/HoverCard.jsx';
import ImageWithFallback from '../../../app/ImageWithFallback.jsx';
import useOrganizerSearch from '../context/useOrganizerSearch.js';
import { useClientContext } from '../context/ClientContext.jsx';
import PortalSelect from '../../../app/PortalSelect.jsx';
export default function FindOrganizersPage() {
  const { filters, updateFilter } = useOrganizerSearch();
  const portalContext = useClientContext();
  const portalActions = portalContext.actions;
  const { DB: workspaceData } = portalContext;
  const q = filters.q.trim().toLowerCase();
  const rating = filters.rating;
  const category = filters.category;
  const city = filters.city;
  const pricing = filters.pricing;
  let organizers = workspaceData.users.filter(user => user.role === 'organizer');
  if (q) {
    organizers = organizers.filter(organizer =>
      [
        organizer.name,
        organizer.service,
        organizer.specialization,
        organizer.category,
        organizer.city,
        organizer.location,
      ]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(q))
    );
  }
  if (category !== 'all') {
    organizers = organizers.filter(
      organizer =>
        organizer.service === category ||
        organizer.eventTypes?.includes(category) ||
        (organizer.specializations && organizer.specializations.includes(category))
    );
  }
  if (city !== 'all') {
    organizers = organizers.filter(
      organizer =>
        (organizer.city || '').toLowerCase() === city.toLowerCase() ||
        (organizer.location || '').toLowerCase() === city.toLowerCase()
    );
  }
  if (rating !== 'all') {
    const minRating = parseFloat(rating);
    organizers = organizers.filter(organizer => (organizer.rating || 0) >= minRating);
  }
  if (pricing !== 'all') {
    organizers = organizers.filter(organizer => {
      const prices = (organizer.packages || [])
        .map((p, index) => Number(String(p.price || '').replace(/[^0-9]/g, '')))
        .filter(n => !isNaN(n) && n > 0);
      const minPrice = prices.length ? Math.min(...prices) : 35000;
      if (pricing === 'under_50k') return minPrice < 50000;
      if (pricing === '50k_100k') return minPrice >= 50000 && minPrice <= 100000;
      if (pricing === '100k_250k') return minPrice >= 100000 && minPrice <= 250000;
      if (pricing === 'above_250k') return minPrice >= 250000;
      return true;
    });
  }
  return (
    <>
      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-title">Find Event Organisers</div>
          <div className="page-sub">
            Discover and connect with top-rated event organizers across India
          </div>
        </div>
      </div>
      <div
        className="filter-row"
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '16px',
        }}
      >
        <div
          className="search-box input-group"
          style={{
            flex: '1',
            minWidth: '240px',
            maxWidth: '320px',
          }}
        >
          <span className="input-icon">🔍</span>
          <input
            className="form-control"
            id="search-org-q"
            placeholder="Search by organizer or specialty..."
            value={filters.q}
            onChange={event => updateFilter('q', event.target.value)}
          />
        </div>
        <PortalSelect
          className="form-control filter-select"
          id="search-org-category"
          value={filters.category}
          onChange={event => updateFilter('category', event.target.value)}
        >
          <option value="all">All Categories</option>
          <option>Corporate Events</option>
          <option>Conferences</option>
          <option>Weddings &amp; Social Events</option>
          <option>Workshops</option>
          <option>Product Launches</option>
        </PortalSelect>
        <PortalSelect
          className="form-control filter-select"
          id="search-org-city"
          value={filters.city}
          onChange={event => updateFilter('city', event.target.value)}
        >
          <option value="all">All Locations</option>
          <option>Mumbai</option>
          <option>New Delhi</option>
          <option>Bangalore</option>
          <option>Hyderabad</option>
          <option>Chennai</option>
        </PortalSelect>
        <PortalSelect
          className="form-control filter-select"
          id="search-org-rating"
          value={filters.rating}
          onChange={event => updateFilter('rating', event.target.value)}
        >
          <option value="all">All Ratings</option>
          <option value="4.5">4.5+ stars</option>
          <option value="4">4+ stars</option>
          <option value="3.5">3.5+ stars</option>
        </PortalSelect>
        <PortalSelect
          className="form-control filter-select"
          id="search-org-pricing"
          value={filters.pricing}
          onChange={event => updateFilter('pricing', event.target.value)}
        >
          <option value="all">All Pricing</option>
          <option value="under_50k">Under ₹50,000</option>
          <option value="50k_100k">₹50,000 – ₹1,00,000</option>
          <option value="100k_250k">₹1,00,000 – ₹2,50,000</option>
          <option value="above_250k">₹2,50,000+</option>
        </PortalSelect>
      </div>
      <div
        style={{
          marginBottom: '16px',
          color: 'var(--text2)',
          fontSize: '13px',
        }}
      >
        Showing {organizers.length} event organiser{organizers.length !== 1 ? 's' : ''}
      </div>
      <div
        className="grid-3"
        style={{
          gap: '16px',
        }}
      >
        {organizers.length === 0 ? (
          <div
            className="empty"
            style={{
              gridColumn: '1/-1',
            }}
          >
            <div className="empty-icon">🔍</div>
            <div className="empty-title">No organizers found</div>
            <p>Try adjusting your search filters</p>
          </div>
        ) : (
          organizers.map((organizer, index) => {
            const rt = Number(organizer.rating) || 0;
            const rv = Number(organizer.reviewCount) || 0;
            const prices = (organizer.packages || [])
              .map((p, index) => Number(String(p.price || '').replace(/[^0-9]/g, '')))
              .filter(n => !isNaN(n) && n > 0);
            const startPrice = prices.length ? Math.min(...prices) : 35000;
            const orgAv = organizer.avatarImage ? (
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: '0',
                  border: `2px solid ${organizer.color || 'var(--accent)'}40`,
                  position: 'relative',
                }}
              >
                <ImageWithFallback
                  src={organizer.avatarImage}
                  alt={organizer.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  fallbackTag="div"
                  fallbackProps={{
                    style: {
                      display: 'flex',
                      width: '100%',
                      height: '100%',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `${organizer.color || 'var(--accent)'}20`,
                      fontSize: '20px',
                      fontWeight: '700',
                      color: organizer.color || 'var(--accent)',
                    },
                  }}
                >
                  {organizer.avatar || organizer.name[0]}
                </ImageWithFallback>
              </div>
            ) : (
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  flexShrink: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${organizer.color || 'var(--accent)'}15`,
                  fontSize: '20px',
                  fontWeight: '700',
                  color: organizer.color || 'var(--accent)',
                  border: `2px solid ${organizer.color || 'var(--accent)'}30`,
                }}
              >
                {organizer.avatar || organizer.name[0]}
              </div>
            );
            return (
              <HoverCard
                className="card"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'transform .18s,box-shadow .18s',
                  cursor: 'pointer',
                }}
                onClick={() => portalActions.onViewOrganizerProfile(organizer.id)}
                key={organizer?.id ?? organizer?.name ?? index}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  {orgAv}
                  <div
                    style={{
                      flex: '1',
                      minWidth: '0',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '2px',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: '700',
                          fontSize: '14.5px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {organizer.name}
                      </span>
                      <span
                        style={{
                          background: 'var(--yellow)',
                          color: '#1a1400',
                          padding: '1px 7px',
                          borderRadius: '10px',
                          fontSize: '10.5px',
                          fontWeight: '700',
                          flexShrink: '0',
                        }}
                      >
                        ⭐ {rt ? rt.toFixed(1) : '—'}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--accent)',
                        fontWeight: '500',
                        marginBottom: '2px',
                      }}
                    >
                      {organizer.service || 'Event Organizer'}
                    </div>
                    <div
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--text3)',
                      }}
                    >
                      📍 {organizer.city || 'India'}
                    </div>
                  </div>
                </div>
                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--text2)',
                    lineHeight: '1.5',
                    margin: '0',
                    display: '-webkit-box',
                    WebkitLineClamp: '2',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {organizer.bio ||
                    'Professional event organizer with extensive industry experience.'}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      background: 'var(--surface3)',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: 'var(--text2)',
                    }}
                  >
                    <strong
                      style={{
                        color: 'var(--text)',
                      }}
                    >
                      {rv}
                    </strong>{' '}
                    reviews
                  </span>
                  <span
                    style={{
                      background: 'rgba(16,185,129,0.12)',
                      color: 'var(--green)',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                    }}
                  >
                    Starts at ₹{startPrice.toLocaleString()}
                  </span>
                </div>
                <button
                  className="btn btn-primary btn-sm w-full"
                  onClick={event => {
                    event.stopPropagation();
                    portalActions.onViewOrganizerProfile(organizer.id);
                  }}
                  style={{
                    justifyContent: 'center',
                    padding: '8px',
                    fontSize: '12.5px',
                  }}
                >
                  View Profile &amp; Request Event
                </button>
              </HoverCard>
            );
          })
        )}
      </div>
    </>
  );
}
