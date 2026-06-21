import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { storableError } from '../../util/errors';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { fetchPageAssets } from '../../ducks/hostedAssets.duck';

export const ASSET_NAME = 'landing-page';

// ─── Async Thunk ─────────────────────────────────────────────────────────────

export const fetchLandingListings = createAsyncThunk(
  'LandingPage/fetchLandingListings',
  async (_, { dispatch, rejectWithValue, extra: sdk }) => {
    try {
      const response = await sdk.listings.query({
        perPage: 12,
        page: 1,
        include: ['images', 'author'],
        'fields.listing': ['title', 'geolocation', 'price', 'deleted', 'state', 'publicData'],
        'fields.image': ['variants.landscape-crop', 'variants.landscape-crop2x'],
        'imageVariant.landscape-crop': 'w:400;h:267;fit:crop',
        'imageVariant.landscape-crop2x': 'w:800;h:533;fit:crop',
        'limit.images': 1,
      });

      dispatch(addMarketplaceEntities(response));

      const ids = response.data.data
        .filter(l => !l.attributes.deleted && l.attributes.state === 'published')
        .map(l => l.id.uuid);

      return ids;
    } catch (e) {
      return rejectWithValue(storableError(e));
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const landingPageSlice = createSlice({
  name: 'LandingPage',
  initialState: {
    listingIds: [],
    fetchInProgress: false,
    fetchError: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchLandingListings.pending, state => {
        state.fetchInProgress = true;
        state.fetchError = null;
      })
      .addCase(fetchLandingListings.fulfilled, (state, action) => {
        state.fetchInProgress = false;
        state.listingIds = action.payload;
      })
      .addCase(fetchLandingListings.rejected, (state, action) => {
        state.fetchInProgress = false;
        state.fetchError = action.payload;
      });
  },
});

export default landingPageSlice.reducer;

// ─── loadData ─────────────────────────────────────────────────────────────────

export const loadData = (params, search) => dispatch => {
  const pageAsset = { landingPage: `content/pages/${ASSET_NAME}.json` };
  return Promise.all([
    dispatch(fetchPageAssets(pageAsset, true)),
    dispatch(fetchLandingListings()),
  ]);
};
