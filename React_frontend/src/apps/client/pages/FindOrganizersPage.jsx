import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

// App.jsx extracts the marked functions into the browser runtime.
// The React component below mounts the HTML returned by those functions.
function portalRuntimeDefinitions() {
  /* PORTAL_RUNTIME_START */
  function pageFindOrganizers() {
    const q = (sessionStorage.getItem('search_org_q') || '').trim().toLowerCase();
    const rating = sessionStorage.getItem('search_org_rating') || 'all';
    const category = sessionStorage.getItem('search_org_category') || 'all';
    const city = sessionStorage.getItem('search_org_city') || 'all';
    const pricing = sessionStorage.getItem('search_org_pricing') || 'all';

    let organizers = DB.users.filter(user => user.role === 'organizer');

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
          .map(p => Number(String(p.price || '').replace(/[^0-9]/g, '')))
          .filter(n => !isNaN(n) && n > 0);
        const minPrice = prices.length ? Math.min(...prices) : 35000;
        if (pricing === 'under_50k') return minPrice < 50000;
        if (pricing === '50k_100k') return minPrice >= 50000 && minPrice <= 100000;
        if (pricing === '100k_250k') return minPrice >= 100000 && minPrice <= 250000;
        if (pricing === 'above_250k') return minPrice >= 250000;
        return true;
      });
    }

    return `
  <div class="page-hd">
    <div class="page-hd-left">
      <div class="page-title">Find Event Organisers</div>
      <div class="page-sub">Discover and connect with top-rated event organizers across India</div>
    </div>
  </div>
  
  <div class="filter-row" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
    <div class="search-box input-group" style="flex:1;min-width:240px;max-width:320px">
      <span class="input-icon">🔍</span>
      <input class="form-control" id="search-org-q" placeholder="Search by organizer or specialty..." value="${q}" oninput="searchOrganizers(this.value)">
    </div>
    <select class="form-control filter-select" id="search-org-category" onchange="filterOrganizers()">
      <option value="all">All Categories</option>
      <option ${category === 'Corporate Events' ? 'selected' : ''}>Corporate Events</option>
      <option ${category === 'Conferences' ? 'selected' : ''}>Conferences</option>
      <option ${
        category === 'Weddings & Social Events' ? 'selected' : ''
      }>Weddings & Social Events</option>
      <option ${category === 'Workshops' ? 'selected' : ''}>Workshops</option>
      <option ${category === 'Product Launches' ? 'selected' : ''}>Product Launches</option>
    </select>
    <select class="form-control filter-select" id="search-org-city" onchange="filterOrganizers()">
      <option value="all">All Locations</option>
      <option ${city === 'Mumbai' ? 'selected' : ''}>Mumbai</option>
      <option ${city === 'New Delhi' ? 'selected' : ''}>New Delhi</option>
      <option ${city === 'Bangalore' ? 'selected' : ''}>Bangalore</option>
      <option ${city === 'Hyderabad' ? 'selected' : ''}>Hyderabad</option>
      <option ${city === 'Chennai' ? 'selected' : ''}>Chennai</option>
    </select>
    <select class="form-control filter-select" id="search-org-rating" onchange="filterOrganizers()">
      <option value="all">All Ratings</option>
      <option value="4.5" ${rating === '4.5' ? 'selected' : ''}>4.5+ stars</option>
      <option value="4" ${rating === '4' ? 'selected' : ''}>4+ stars</option>
      <option value="3.5" ${rating === '3.5' ? 'selected' : ''}>3.5+ stars</option>
    </select>
    <select class="form-control filter-select" id="search-org-pricing" onchange="filterOrganizers()">
      <option value="all">All Pricing</option>
      <option value="under_50k" ${pricing === 'under_50k' ? 'selected' : ''}>Under ₹50,000</option>
      <option value="50k_100k" ${
        pricing === '50k_100k' ? 'selected' : ''
      }>₹50,000 – ₹1,00,000</option>
      <option value="100k_250k" ${
        pricing === '100k_250k' ? 'selected' : ''
      }>₹1,00,000 – ₹2,50,000</option>
      <option value="above_250k" ${pricing === 'above_250k' ? 'selected' : ''}>₹2,50,000+</option>
    </select>
  </div>
  
  <div style="margin-bottom:16px;color:var(--text2);font-size:13px">Showing ${
    organizers.length
  } event organiser${organizers.length !== 1 ? 's' : ''}</div>
  
  <div class="grid-3" style="gap:16px">
    ${
      organizers.length === 0
        ? `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">🔍</div><div class="empty-title">No organizers found</div><p>Try adjusting your search filters</p></div>`
        : organizers
            .map(organizer => {
              const rt = Number(organizer.rating) || 0;
              const rv = Number(organizer.reviewCount) || 0;
              const prices = (organizer.packages || [])
                .map(p => Number(String(p.price || '').replace(/[^0-9]/g, '')))
                .filter(n => !isNaN(n) && n > 0);
              const startPrice = prices.length ? Math.min(...prices) : 35000;
              const orgAv = organizer.avatarImage
                ? `
          <div style="width:56px;height:56px;border-radius:50%;overflow:hidden;flex-shrink:0;border:2px solid ${
            organizer.color || 'var(--accent)'
          }40;position:relative">
            <img src="${organizer.avatarImage}" alt="${
                    organizer.name
                  }" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;background:${
              organizer.color || 'var(--accent)'
            }20;font-size:20px;font-weight:700;color:${organizer.color || 'var(--accent)'}">${
                    organizer.avatar || organizer.name[0]
                  }</div>
          </div>
        `
                : `<div style="width:56px;height:56px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:${
                    organizer.color || 'var(--accent)'
                  }15;font-size:20px;font-weight:700;color:${
                    organizer.color || 'var(--accent)'
                  };border:2px solid ${organizer.color || 'var(--accent)'}30">${
                    organizer.avatar || organizer.name[0]
                  }</div>`;
              return `
      <div class="card" style="padding:16px;display:flex;flex-direction:column;gap:12px;transition:transform .18s,box-shadow .18s;cursor:pointer" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 28px rgba(0,0,0,0.12)'" onmouseout="this.style.transform='';this.style.boxShadow=''" onclick="viewOrganizerProfile('${
        organizer.id
      }')">
        <div style="display:flex;align-items:center;gap:12px">
          ${orgAv}
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
              <span style="font-weight:700;font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${
                organizer.name
              }</span>
              <span style="background:var(--yellow);color:#1a1400;padding:1px 7px;border-radius:10px;font-size:10.5px;font-weight:700;flex-shrink:0">⭐ ${
                rt ? rt.toFixed(1) : '—'
              }</span>
            </div>
            <div style="font-size:12px;color:var(--accent);font-weight:500;margin-bottom:2px">${
              organizer.service || 'Event Organizer'
            }</div>
            <div style="font-size:11.5px;color:var(--text3)">📍 ${organizer.city || 'India'}</div>
          </div>
        </div>
        <p style="font-size:12px;color:var(--text2);line-height:1.5;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${
          organizer.bio || 'Professional event organizer with extensive industry experience.'
        }</p>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap">
          <span style="background:var(--surface3);padding:3px 10px;border-radius:6px;font-size:11px;color:var(--text2)"><strong style="color:var(--text)">${rv}</strong> reviews</span>
          <span style="background:rgba(16,185,129,0.12);color:var(--green);padding:3px 10px;border-radius:6px;font-size:11.5px;font-weight:700">Starts at ₹${startPrice.toLocaleString()}</span>
        </div>
        <button class="btn btn-primary btn-sm w-full" onclick="event.stopPropagation();viewOrganizerProfile('${
          organizer.id
        }')" style="justify-content:center;padding:8px;font-size:12.5px">View Profile & Request Event</button>
      </div>`;
            })
            .join('')
    }
  </div>`;
  }
  /* PORTAL_RUNTIME_END */
}

export default function FindOrganizersPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
