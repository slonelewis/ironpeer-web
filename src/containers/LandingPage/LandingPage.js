import React, { useState } from 'react';
import { bool, object, arrayOf } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { Page, NamedLink } from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import { getListingsById } from '../../ducks/marketplaceData.duck';

import css from './LandingPage.module.css';

// ─── SVG ICONS ────────────────────────────────────────────────────────────────

const ExcavatorIcon = () => (
  <svg width="52" height="48" viewBox="0 0 52 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Track */}
    <rect x="6" y="35" width="38" height="9" rx="4" fill="#374151"/>
    <circle cx="12" cy="39" r="4" fill="#6B7280"/>
    <circle cx="38" cy="39" r="4" fill="#6B7280"/>
    {/* Body */}
    <rect x="22" y="22" width="22" height="15" rx="2" fill="#E8450A"/>
    {/* Cab */}
    <rect x="28" y="12" width="16" height="13" rx="2" fill="#E8450A"/>
    {/* Window */}
    <rect x="30" y="14" width="10" height="8" rx="1" fill="white" fillOpacity="0.5"/>
    {/* Counterweight */}
    <rect x="42" y="26" width="4" height="9" rx="1" fill="#C93A08"/>
    {/* Boom */}
    <line x1="24" y1="26" x2="9" y2="18" stroke="#374151" strokeWidth="4" strokeLinecap="round"/>
    {/* Stick */}
    <line x1="9" y1="18" x2="4" y2="33" stroke="#374151" strokeWidth="3.5" strokeLinecap="round"/>
    {/* Bucket */}
    <path d="M1 30 L4 33 L7 37 L0 38 Z" fill="#374151"/>
  </svg>
);

const DumpTrailerIcon = () => (
  <svg width="56" height="48" viewBox="0 0 56 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Hitch tongue */}
    <rect x="0" y="29" width="12" height="4" rx="2" fill="#6B7280"/>
    <circle cx="2" cy="31" r="3" fill="#374151"/>
    {/* Dump box tilted up */}
    <polygon points="10,22 10,7 52,16 52,31" fill="#E8450A"/>
    {/* Front wall of box */}
    <line x1="10" y1="7" x2="10" y2="22" stroke="#C93A08" strokeWidth="2.5"/>
    {/* Trailer frame */}
    <rect x="10" y="31" width="42" height="5" rx="1" fill="#6B7280"/>
    {/* Tandem axle wheels */}
    <circle cx="28" cy="42" r="6" fill="#111827"/>
    <circle cx="28" cy="42" r="2.5" fill="#9CA3AF"/>
    <circle cx="44" cy="42" r="6" fill="#111827"/>
    <circle cx="44" cy="42" r="2.5" fill="#9CA3AF"/>
  </svg>
);

const ZeroTurnMowerIcon = () => (
  <svg width="52" height="48" viewBox="0 0 52 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Large rear wheels */}
    <circle cx="7" cy="34" r="10" fill="#111827"/>
    <circle cx="7" cy="34" r="4" fill="#6B7280"/>
    <circle cx="45" cy="34" r="10" fill="#111827"/>
    <circle cx="45" cy="34" r="4" fill="#6B7280"/>
    {/* Deck */}
    <rect x="11" y="24" width="30" height="14" rx="4" fill="#E8450A"/>
    {/* Seat back */}
    <rect x="20" y="10" width="12" height="10" rx="2" fill="#374151"/>
    {/* Seat */}
    <rect x="18" y="18" width="16" height="8" rx="2" fill="#374151"/>
    {/* Front casters */}
    <circle cx="17" cy="43" r="4" fill="#374151"/>
    <circle cx="35" cy="43" r="4" fill="#374151"/>
    {/* Blade line */}
    <line x1="18" y1="31" x2="34" y2="31" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <line x1="26" y1="25" x2="26" y2="37" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ─── LISTING DATA ──────────────────────────────────────────────────────────────

const FEATURED_LISTINGS = [
  {
    emoji: '🚜',
    bg: 'linear-gradient(135deg, #D4E4C2, #A8C285)',
    badge: '⭐ Top rated',
    name: 'John Deere 60G Mini Excavator',
    location: 'Ellensburg, WA · 4 mi away',
    price: '$285',
    rating: '⭐ 4.9',
  },
  {
    emoji: '🏗️',
    bg: 'linear-gradient(135deg, #C4D4E8, #85A8CB)',
    badge: 'New listing',
    name: 'Bobcat S650 Skid Steer',
    location: 'Yakima, WA · 38 mi away',
    price: '$320',
    rating: '⭐ 4.8',
  },
  {
    emoji: '🚛',
    bg: 'linear-gradient(135deg, #E8D4C0, #CBB085)',
    badge: 'Delivery available',
    name: '20ft Flatbed Equipment Trailer',
    location: 'Ellensburg, WA · 7 mi away',
    price: '$95',
    rating: '⭐ 5.0',
  },
  {
    emoji: '🌾',
    bg: 'linear-gradient(135deg, #E8E4C0, #CBCA85)',
    badge: '⭐ Top rated',
    name: 'Kubota MX5400 Tractor w/ Loader',
    location: 'Cle Elum, WA · 22 mi away',
    price: '$220',
    rating: '⭐ 4.7',
  },
  {
    emoji: '⚡',
    bg: 'linear-gradient(135deg, #D4C2E8, #A885CB)',
    badge: null,
    name: '30kW Generator — Diesel',
    location: 'Wenatchee, WA · 45 mi away',
    price: '$175',
    rating: '⭐ 4.6',
  },
  {
    emoji: '🔩',
    bg: 'linear-gradient(135deg, #C2E4D4, #85CBA8)',
    badge: null,
    name: 'Auger — 12" & 24" Bits Included',
    location: 'Ellensburg, WA · 2 mi away',
    price: '$75',
    rating: '⭐ 4.9',
  },
];

const RECENT_LISTINGS = [
  {
    emoji: '🌿',
    bg: 'linear-gradient(135deg, #E8C4C2, #CB8585)',
    badge: 'New listing',
    name: 'Skid Steer Brush Cutter Attachment',
    location: 'Ellensburg, WA · 5 mi away',
    price: '$110',
    rating: '⭐ 4.8',
  },
  {
    emoji: '🚚',
    bg: 'linear-gradient(135deg, #C2D4E8, #85AACB)',
    badge: null,
    name: 'Dump Trailer — 14ft Low Pro',
    location: 'Kittitas, WA · 12 mi away',
    price: '$120',
    rating: '⭐ 4.7',
  },
  {
    emoji: '🚜',
    bg: 'linear-gradient(135deg, #E8E0C2, #CBBC85)',
    badge: '⭐ Top rated',
    name: 'Compact Track Loader — Cat 259D',
    location: 'Selah, WA · 30 mi away',
    price: '$350',
    rating: '⭐ 5.0',
  },
  {
    emoji: '❄️',
    bg: 'linear-gradient(135deg, #D4E8E4, #85CBC3)',
    badge: null,
    name: 'UTV / Side-by-Side — Can-Am',
    location: 'Cle Elum, WA · 24 mi away',
    price: '$195',
    rating: '⭐ 4.8',
  },
  {
    emoji: '⚡',
    bg: 'linear-gradient(135deg, #E4D4E8, #BF85CB)',
    badge: 'Delivery available',
    name: 'Light Tower — 4-Head Diesel',
    location: 'Ellensburg, WA · 8 mi away',
    price: '$90',
    rating: '⭐ 4.9',
  },
  {
    emoji: '🏗️',
    bg: 'linear-gradient(135deg, #D4C8E8, #9985CB)',
    badge: null,
    name: 'Plate Compactor — Wacker Neuson',
    location: 'Yakima, WA · 40 mi away',
    price: '$65',
    rating: '⭐ 4.6',
  },
];

const CATEGORIES = [
  { icon: <ExcavatorIcon />, name: 'Dirt Work', categoryId: 'Dirt_work' },
  { icon: <DumpTrailerIcon />, name: 'Hauling & Trailers', categoryId: 'Haulers_and_trailers' },
  { icon: '🚜', name: 'Farm & Agriculture', categoryId: 'Farm_and_agriculture' },
  { icon: '🏗️', name: 'Construction', categoryId: 'Construction' },
  { icon: '🌿', name: 'Lawn & Landscaping', categoryId: 'Lawn_and_landscaping' },
  { icon: '⚡', name: 'Power & Lighting', categoryId: 'Power_and_lighting' },
  { icon: '❄️', name: 'Snow Removal', categoryId: 'Snow_removal' },
  { icon: '🔩', name: 'Other', categoryId: 'Other' },
];

// ─── LISTING CARD ─────────────────────────────────────────────────────────────

const PLACEHOLDER_BG = [
  'linear-gradient(135deg, #D4E4C2, #A8C285)',
  'linear-gradient(135deg, #C4D4E8, #85A8CB)',
  'linear-gradient(135deg, #E8D4C0, #CBB085)',
  'linear-gradient(135deg, #E8E4C0, #CBCA85)',
  'linear-gradient(135deg, #D4C2E8, #A885CB)',
  'linear-gradient(135deg, #C2E4D4, #85CBA8)',
];

const RealListingCard = ({ listing, index }) => {
  const { title, price, geolocation } = listing.attributes || {};
  const images = listing.images || [];
  const firstImage = images[0];
  const imageUrl =
    firstImage?.attributes?.variants?.['landscape-crop']?.url ||
    firstImage?.attributes?.variants?.['landscape-crop2x']?.url ||
    null;
  const bg = PLACEHOLDER_BG[index % PLACEHOLDER_BG.length];
  const formattedPrice = price
    ? `$${Math.round(price.amount / 100)}`
    : null;

  return (
    <NamedLink
      name="ListingPage"
      params={{ id: listing.id.uuid, slug: title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'listing' }}
      className={css.listingCard}
    >
      <div
        className={css.listingImg}
        style={imageUrl ? { backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: bg }}
      >
        {!imageUrl && <span className={css.listingEmoji}>🚜</span>}
      </div>
      <div className={css.listingMeta}>
        <div>
          <div className={css.listingName}>{title}</div>
          {geolocation && (
            <div className={css.listingLocation}>
              {listing.attributes?.publicData?.locationAddress || 'Location not specified'}
            </div>
          )}
          {formattedPrice && (
            <div className={css.listingPrice}>
              <strong>{formattedPrice}</strong> / day
            </div>
          )}
        </div>
      </div>
    </NamedLink>
  );
};

// Fallback mock card (used when no real listings yet)
// These are illustrative examples only — labeled clearly so users aren't misled
const MockListingCard = ({ listing }) => (
  <NamedLink name="SignupPage" className={`${css.listingCard} ${css.listingCardMock}`}>
    <div className={css.listingImg} style={{ background: listing.bg }}>
      <span className={css.listingEmoji}>{listing.emoji}</span>
      <span className={css.listingBadgeSample}>Sample</span>
    </div>
    <div className={css.listingMeta}>
      <div>
        <div className={css.listingName}>{listing.name}</div>
        <div className={css.listingLocation}>{listing.location}</div>
        <div className={css.listingPrice}>
          <strong>{listing.price}</strong> / day
        </div>
      </div>
      <div className={css.listingRating}>{listing.rating}</div>
    </div>
  </NamedLink>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export const LandingPageComponent = props => {
  const { realListings = [] } = props;
  const [activeTab, setActiveTab] = useState('rent');
  const hasRealListings = realListings.length > 0;
  const featuredReal = realListings.slice(0, 6);
  const recentReal = realListings.slice(6, 12);

  return (
    <Page
      title="IronPeer — The Peer to Peer Equipment Rental Marketplace"
      description="Rent, list, or haul equipment locally. IronPeer is the peer-to-peer equipment rental marketplace built for real work."
      schema={{
        '@context': 'http://schema.org',
        '@type': 'WebPage',
        description: 'IronPeer — peer-to-peer equipment rental marketplace',
        name: 'IronPeer',
      }}
    >
      <TopbarContainer />

      {/* ── SEARCH HEADER ── */}
      <div className={css.searchHeader}>
        <div className={css.searchTabs}>
          {['rent', 'list', 'haul'].map(tab => (
            <button
              key={tab}
              className={`${css.searchTab}${activeTab === tab ? ` ${css.searchTabActive}` : ''}`}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* RENT TAB */}
        {activeTab === 'rent' && (
          <div className={css.tabContent}>
            <div className={css.searchBar}>
              <input
                className={css.searchField}
                type="text"
                placeholder="What do you need?"
              />
              <div className={css.searchDivider} />
              <div className={css.searchLocationWrap}>
                <span className={css.searchLocationIcon}>📍</span>
                <input
                  className={`${css.searchField} ${css.searchFieldLocation}`}
                  type="text"
                  placeholder="City, zip, or address"
                />
              </div>
              <div className={css.searchDivider} />
              <input
                className={css.searchField}
                type="text"
                placeholder="Dates"
              />
              <NamedLink name="SearchPage" className={css.searchBtn}>
                🔍 Search
              </NamedLink>
            </div>
            <div className={css.searchBarHints}>
              <span className={css.searchHint}>
                Mini excavators · Skid steers · Trailers · Tractors · Attachments · and more
              </span>
            </div>
          </div>
        )}

        {/* LIST TAB */}
        {activeTab === 'list' && (
          <div className={css.tabContent}>
            <div className={css.tabCta}>
              <p>List your equipment, trailers or attachments today and start earning money!</p>
              <NamedLink name="NewListingPage" className={css.ctaBtn}>
                Get started — it&apos;s free
              </NamedLink>
            </div>
          </div>
        )}

        {/* HAUL TAB */}
        {activeTab === 'haul' && (
          <div className={css.tabContent}>
            <div className={css.tabCta}>
              <p>Sign up today and earn money hauling trailers and equipment locally!</p>
              <NamedLink name="SignupPage" className={css.ctaBtn}>
                Become a hauler
              </NamedLink>
            </div>
          </div>
        )}
      </div>

      {/* ── FEATURED LISTINGS ── */}
      <section className={css.listings}>
        <div className={css.sectionLabel}>Available near you</div>
        <div className={css.sectionTitle}>Featured equipment</div>
        {!hasRealListings && (
          <div className={css.mockListingsBanner}>
            <span className={css.mockListingsBannerIcon}>🚀</span>
            <div>
              <strong>IronPeer is just getting started.</strong> These are example listings to show you what's coming.
              {' '}<NamedLink name="SignupPage" className={css.mockListingsBannerLink}>List your equipment first →</NamedLink>
            </div>
          </div>
        )}
        <div className={css.listingsGrid}>
          {hasRealListings
            ? featuredReal.map((listing, i) => (
                <RealListingCard key={listing.id.uuid} listing={listing} index={i} />
              ))
            : FEATURED_LISTINGS.map((listing, i) => (
                <MockListingCard key={i} listing={listing} />
              ))}
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className={css.categories}>
        <div className={css.sectionLabel}>Browse by category</div>
        <div className={css.sectionTitle}>Find what you need</div>
        <div className={css.categoryGrid}>
          {CATEGORIES.map((cat, i) => (
            <NamedLink
              key={i}
              name="SearchPage"
              to={{ search: `?pub_categoryLevel1=${cat.categoryId}` }}
              className={css.categoryCard}
            >
              <div className={css.categoryIcon}>
                {typeof cat.icon === 'string' ? cat.icon : cat.icon}
              </div>
              <div className={css.categoryName}>{cat.name}</div>
            </NamedLink>
          ))}
        </div>
      </section>

      {/* ── MORE LISTINGS ── */}
      {(hasRealListings ? recentReal.length > 0 : true) && (
        <section className={css.listingsMore}>
          <div className={css.sectionLabel}>More near you</div>
          <div className={css.sectionTitle}>Recently listed</div>
          <div className={css.listingsGrid}>
            {hasRealListings
              ? recentReal.map((listing, i) => (
                  <RealListingCard key={listing.id.uuid} listing={listing} index={i + 6} />
                ))
              : RECENT_LISTINGS.map((listing, i) => (
                  <MockListingCard key={i} listing={listing} />
                ))}
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ── */}
      <section className={css.howItWorks}>
        <div className={css.howItWorksInner}>
          <div className={css.sectionLabel}>How it works</div>
          <h2 className={css.howItWorksTitle}>Three ways to use IronPeer</h2>
          <p className={css.howItWorksSubtitle}>
            Whether you need equipment, own it, or haul it — IronPeer is built for you.
          </p>

          <div className={css.roleCards}>
            {/* RENT CARD */}
            <div className={css.roleCard}>
              <span className={css.roleTag}>Rent</span>
              <h3 className={css.roleCardTitle}>Find the equipment you need</h3>
              <p className={css.roleCardDesc}>
                Browse local listings, book online, and get it delivered to your job — or pick it
                up yourself.
              </p>
              <ul className={css.roleSteps}>
                <li><span className={css.stepNum}>1</span> Search by equipment type and location</li>
                <li><span className={css.stepNum}>2</span> Choose pickup or delivery</li>
                <li><span className={css.stepNum}>3</span> Book and pay securely online</li>
                <li><span className={css.stepNum}>4</span> Get the job done</li>
              </ul>
              <NamedLink name="SearchPage" className={`${css.roleBtn} ${css.roleBtnPrimary}`}>
                Find equipment near me
              </NamedLink>
            </div>

            {/* LIST CARD */}
            <div className={css.roleCard}>
              <span className={css.roleTag}>List</span>
              <h3 className={css.roleCardTitle}>Put your idle equipment to work</h3>
              <p className={css.roleCardDesc}>
                Got equipment sitting in your yard? List it in minutes and start earning passive
                income.
              </p>
              <ul className={css.roleSteps}>
                <li><span className={css.stepNum}>1</span> Create a free listing in minutes</li>
                <li><span className={css.stepNum}>2</span> Set your rate and availability</li>
                <li><span className={css.stepNum}>3</span> We handle booking and payment</li>
                <li><span className={css.stepNum}>4</span> Get paid — we handle the rest</li>
              </ul>
              <NamedLink name="SignupPage" className={`${css.roleBtn} ${css.roleBtnPrimary}`}>
                List my equipment
              </NamedLink>
            </div>

            {/* HAUL CARD */}
            <div className={css.roleCard}>
              <span className={css.roleTag}>Haul</span>
              <h3 className={css.roleCardTitle}>Earn delivering equipment</h3>
              <p className={css.roleCardDesc}>
                Use your truck and trailer to deliver equipment on your schedule. Work when you
                want.
              </p>
              <ul className={css.roleSteps}>
                <li><span className={css.stepNum}>1</span> Sign up as a hauler</li>
                <li><span className={css.stepNum}>2</span> Accept delivery jobs near you</li>
                <li><span className={css.stepNum}>3</span> Pick up and deliver equipment</li>
                <li><span className={css.stepNum}>4</span> Get paid per delivery</li>
              </ul>
              <NamedLink name="SignupPage" className={`${css.roleBtn} ${css.roleBtnSecondary}`}>
                Become a hauler
              </NamedLink>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <div className={css.trustStripWrapper}>
        <div className={css.trustStrip}>
          <div className={css.trustItem}>
            <div className={css.trustValue}>$0</div>
            <div className={css.trustLabel}>Free to list</div>
          </div>
          <div className={css.trustItem}>
            <div className={css.trustValue}>$50K</div>
            <div className={css.trustLabel}>Equipment protection per rental</div>
          </div>
          <div className={css.trustItem}>
            <div className={css.trustValue}>24/7</div>
            <div className={css.trustLabel}>Support</div>
          </div>
          <div className={css.trustItem}>
            <div className={css.trustValue}>Local</div>
            <div className={css.trustLabel}>Equipment near you</div>
          </div>
        </div>
      </div>

      <FooterContainer />
    </Page>
  );
};

LandingPageComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
  realListings: arrayOf(object),
};

LandingPageComponent.defaultProps = {
  pageAssetsData: null,
  inProgress: false,
  realListings: [],
};

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  const landingState = state.LandingPage || {};
  const listingIds = (landingState.listingIds || []).map(uuid => ({ uuid, type: 'UUID' }));
  const realListings = getListingsById(state, listingIds);

  return { pageAssetsData, inProgress, error, realListings };
};

const mapDispatchToProps = () => ({});

const LandingPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(LandingPageComponent);

export default LandingPage;
