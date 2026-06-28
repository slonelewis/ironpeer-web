import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { pathByRouteName } from '../../util/routes';
import { hasPermissionToPostListings, showCreateListingLinkForUser } from '../../util/userHelpers';
import { NO_ACCESS_PAGE_POST_LISTINGS } from '../../util/urlHelpers';
import { propTypes } from '../../util/types';
import { isErrorNoPermissionToPostListings } from '../../util/errors';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/ui.duck';

import {
  H3,
  Page,
  PaginationLinks,
  UserNav,
  LayoutSingleColumn,
  NamedLink,
  Modal,
} from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import ManageListingCard from './ManageListingCard/ManageListingCard';

import {
  closeListing,
  openListing,
  getOwnListingsById,
  discardDraft,
} from './ManageListingsPage.duck';
import css from './ManageListingsPage.module.css';
import DiscardDraftModal from './DiscardDraftModal/DiscardDraftModal';

const EmptyState = () => (
  <div className={css.emptyState}>
    <div className={css.emptyStateIcon}>
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="36" cy="36" r="36" fill="#FDF0EB" />
        <path d="M22 44V30a2 2 0 0 1 2-2h4l4-6h8l4 6h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H24a2 2 0 0 1-2-2z" stroke="#E8450A" strokeWidth="2" strokeLinejoin="round" fill="none"/>
        <circle cx="36" cy="37" r="5" stroke="#E8450A" strokeWidth="2" fill="none"/>
        <path d="M20 32h4M48 32h4" stroke="#E8450A" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </div>
    <h2 className={css.emptyStateTitle}>List your first piece of equipment</h2>
    <p className={css.emptyStateSubtitle}>
      Share what you own with people in your area and start earning when it's sitting idle.
    </p>
    <NamedLink className={css.emptyStateCta} name="NewListingPage">
      + Post a listing
    </NamedLink>
    <div className={css.emptyStateCategories}>
      <span>🚜 Farm & ag</span>
      <span>🏗️ Construction</span>
      <span>🚛 Haulers & trailers</span>
      <span>⚡ Power & lighting</span>
      <span>🌿 Lawn & landscaping</span>
    </div>
  </div>
);

const Heading = props => {
  const { listingsAreLoaded, pagination } = props;
  const hasResults = listingsAreLoaded && pagination.totalItems > 0;
  const hasNoResults = listingsAreLoaded && pagination.totalItems === 0;

  return hasResults ? (
    <H3 as="h1" className={css.heading}>
      <FormattedMessage
        id="ManageListingsPage.youHaveListings"
        values={{ count: pagination.totalItems }}
      />
    </H3>
  ) : hasNoResults ? (
    <EmptyState />
  ) : null;
};

const PaginationLinksMaybe = props => {
  const { listingsAreLoaded, pagination, page } = props;
  return listingsAreLoaded && pagination && pagination.totalPages > 1 ? (
    <PaginationLinks
      className={css.pagination}
      pageName="ManageListingsPage"
      pageSearchParams={{ page }}
      pagination={pagination}
    />
  ) : null;
};

/**
 * The ManageListingsPage component.
 *
 * @component
 * @param {Object} props
 * @param {propTypes.currentUser} props.currentUser - The current user
 * @param {propTypes.uuid} props.closingListing - The closing listing
 * @param {Object} props.closingListingError - The closing listing error
 * @param {propTypes.error} props.closingListingError.listingId - The closing listing id
 * @param {propTypes.error} props.closingListingError.error - The closing listing error
 * @param {propTypes.ownListing[]} props.listings - The listings
 * @param {function} props.onCloseListing - The onCloseListing function
 * @param {function} props.onDiscardDraft - The onDiscardDraft function
 * @param {function} props.onOpenListing - The onOpenListing function
 * @param {Object} props.openingListing - The opening listing
 * @param {propTypes.uuid} props.openingListing.uuid - The opening listing uuid
 * @param {Object} props.openingListingError - The opening listing error
 * @param {propTypes.uuid} props.openingListingError.listingId - The opening listing id
 * @param {propTypes.error} props.openingListingError.error - The opening listing error
 * @param {propTypes.pagination} props.pagination - The pagination
 * @param {boolean} props.queryInProgress - Whether the query is in progress
 * @param {propTypes.error} props.queryListingsError - The query listings error
 * @param {Object} props.queryParams - The query params
 * @param {boolean} props.scrollingDisabled - Whether the scrolling is disabled
 * @param {function} props.onManageDisableScrolling - The onManageDisableScrolling function
 * @returns {JSX.Element} manage listings page component
 */
export const ManageListingsPageComponent = props => {
  const [listingMenuOpen, setListingMenuOpen] = useState(null);
  const [discardDraftModalOpen, setDiscardDraftModalOpen] = useState(null);
  const [discardDraftModalId, setDiscardDraftModalId] = useState(null);
  const history = useHistory();
  const routeConfiguration = useRouteConfiguration();
  const config = useConfiguration();
  const intl = useIntl();

  const {
    currentUser,
    closingListing,
    closingListingError,
    discardingDraft,
    discardingDraftError,
    listings = [],
    onCloseListing,
    onDiscardDraft,
    onOpenListing,
    openingListing,
    openingListingError,
    pagination,
    queryInProgress,
    queryListingsError,
    queryParams,
    scrollingDisabled,
    onManageDisableScrolling,
  } = props;

  useEffect(() => {
    if (isErrorNoPermissionToPostListings(openingListingError?.error)) {
      const noAccessPagePath = pathByRouteName('NoAccessPage', routeConfiguration, {
        missingAccessRight: NO_ACCESS_PAGE_POST_LISTINGS,
      });
      history.push(noAccessPagePath);
    }
  }, [openingListingError]);

  const onToggleMenu = listing => {
    setListingMenuOpen(listing);
  };

  const handleOpenListing = listingId => {
    const hasPostingRights = hasPermissionToPostListings(currentUser);

    if (!hasPostingRights) {
      const noAccessPagePath = pathByRouteName('NoAccessPage', routeConfiguration, {
        missingAccessRight: NO_ACCESS_PAGE_POST_LISTINGS,
      });
      history.push(noAccessPagePath);
    } else {
      onOpenListing(listingId);
    }
  };

  const openDiscardDraftModal = listingId => {
    setDiscardDraftModalId(listingId);
    setDiscardDraftModalOpen(true);
  };

  const handleDiscardDraft = () => {
    onDiscardDraft(discardDraftModalId);
    setDiscardDraftModalOpen(false);
    setDiscardDraftModalId(null);
  };

  const hasPaginationInfo = !!pagination && pagination.totalItems != null;
  const listingsAreLoaded = !queryInProgress && hasPaginationInfo;

  const loadingResults = (
    <div className={css.messagePanel}>
      <H3 as="h2" className={css.heading}>
        <FormattedMessage id="ManageListingsPage.loadingOwnListings" />
      </H3>
    </div>
  );

  const queryError = (
    <div className={css.messagePanel}>
      <H3 as="h2" className={css.heading}>
        <FormattedMessage id="ManageListingsPage.queryError" />
      </H3>
    </div>
  );

  const closingErrorListingId = !!closingListingError && closingListingError.listingId;
  const openingErrorListingId = !!openingListingError && openingListingError.listingId;
  const discardingErrorListingId = !!discardingDraftError && discardingDraft.listingId;

  const panelWidth = 62.5;
  // Render hints for responsive image
  const renderSizes = [
    `(max-width: 767px) 100vw`,
    `(max-width: 1920px) ${panelWidth / 2}vw`,
    `${panelWidth / 3}vw`,
  ].join(', ');

  const showManageListingsLink = showCreateListingLinkForUser(config, currentUser);

  return (
    <Page
      title={intl.formatMessage({ id: 'ManageListingsPage.title' })}
      scrollingDisabled={scrollingDisabled}
    >
      <LayoutSingleColumn
        topbar={
          <>
            <TopbarContainer />
            <UserNav
              currentPage="ManageListingsPage"
              showManageListingsLink={showManageListingsLink}
            />
          </>
        }
        footer={<FooterContainer />}
      >
        {queryInProgress ? loadingResults : null}
        {queryListingsError ? queryError : null}

        <div className={css.listingPanel}>
          <Heading listingsAreLoaded={listingsAreLoaded} pagination={pagination} />

          <ul className={css.listingCards}>
            {listings.map(l => (
              <li key={l.id.uuid} className={css.listingCard}>
                <ManageListingCard
                  listing={l}
                  isMenuOpen={!!listingMenuOpen && listingMenuOpen.id.uuid === l.id.uuid}
                  actionsInProgressListingId={openingListing || closingListing || discardingDraft}
                  onToggleMenu={onToggleMenu}
                  onCloseListing={onCloseListing}
                  onOpenListing={handleOpenListing}
                  onDiscardDraft={openDiscardDraftModal}
                  hasOpeningError={openingErrorListingId.uuid === l.id.uuid}
                  hasClosingError={closingErrorListingId.uuid === l.id.uuid}
                  hasDiscardingError={discardingErrorListingId.uuid === l.id.uuid}
                  renderSizes={renderSizes}
                />
              </li>
            ))}
          </ul>
          {onManageDisableScrolling && discardDraftModalOpen ? (
            <DiscardDraftModal
              id="ManageListingsPage"
              isOpen={discardDraftModalOpen}
              onManageDisableScrolling={onManageDisableScrolling}
              onCloseModal={() => setDiscardDraftModalOpen(false)}
              onDiscardDraft={handleDiscardDraft}
              focusElementId={
                discardDraftModalId ? `discardButton_${discardDraftModalId.uuid}` : null
              }
            />
          ) : null}

          <PaginationLinksMaybe
            listingsAreLoaded={listingsAreLoaded}
            pagination={pagination}
            page={queryParams ? queryParams.page : 1}
          />
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const {
    currentPageResultIds,
    pagination,
    queryInProgress,
    queryListingsError,
    queryParams,
    openingListing,
    openingListingError,
    closingListing,
    closingListingError,
    discardingDraft,
    discardingDraftError,
  } = state.ManageListingsPage;
  const listings = getOwnListingsById(state, currentPageResultIds);
  return {
    currentUser,
    currentPageResultIds,
    listings,
    pagination,
    queryInProgress,
    queryListingsError,
    queryParams,
    scrollingDisabled: isScrollingDisabled(state),
    openingListing,
    openingListingError,
    closingListing,
    closingListingError,
    discardingDraft,
    discardingDraftError,
  };
};

const mapDispatchToProps = dispatch => ({
  onCloseListing: listingId => dispatch(closeListing(listingId)),
  onOpenListing: listingId => dispatch(openListing(listingId)),
  onDiscardDraft: listingId => dispatch(discardDraft(listingId)),
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
});

const ManageListingsPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(ManageListingsPageComponent);

export default ManageListingsPage;
