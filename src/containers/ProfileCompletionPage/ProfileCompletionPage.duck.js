import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import { setCurrentUser } from '../../ducks/user.duck';

// ================ Async Thunks ================ //

export const updateProfileThunk = createAsyncThunk(
  'ProfileCompletionPage/updateProfile',
  (actionPayload, { dispatch, rejectWithValue, extra: sdk }) => {
    const queryParams = {
      expand: true,
      include: ['profileImage'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
    };

    return sdk.currentUser
      .updateProfile(actionPayload, queryParams)
      .then(response => {
        const entities = denormalisedResponseEntities(response);
        if (entities.length !== 1) {
          throw new Error('Expected a resource in sdk.currentUser.updateProfile response');
        }
        const currentUser = entities[0];
        dispatch(setCurrentUser(currentUser));
        return response;
      })
      .catch(e => rejectWithValue(storableError(e)));
  }
);

export const uploadImageThunk = createAsyncThunk(
  'ProfileCompletionPage/uploadImage',
  ({ file }, { rejectWithValue, extra: sdk }) => {
    return sdk.images
      .upload(
        { image: file },
        {
          expand: true,
          'fields.image': ['variants.square-small', 'variants.square-small2x'],
        }
      )
      .then(resp => resp.data.data)
      .catch(e => rejectWithValue(storableError(e)));
  }
);

// ================ Slice ================ //

const profileCompletionPageSlice = createSlice({
  name: 'ProfileCompletionPage',
  initialState: {
    updateInProgress: false,
    updateError: null,
    uploadInProgress: false,
    uploadError: null,
  },
  extraReducers: builder => {
    builder
      .addCase(updateProfileThunk.pending, state => {
        state.updateInProgress = true;
        state.updateError = null;
      })
      .addCase(updateProfileThunk.fulfilled, state => {
        state.updateInProgress = false;
      })
      .addCase(updateProfileThunk.rejected, (state, action) => {
        state.updateInProgress = false;
        state.updateError = action.payload;
      })
      .addCase(uploadImageThunk.pending, state => {
        state.uploadInProgress = true;
        state.uploadError = null;
      })
      .addCase(uploadImageThunk.fulfilled, state => {
        state.uploadInProgress = false;
      })
      .addCase(uploadImageThunk.rejected, (state, action) => {
        state.uploadInProgress = false;
        state.uploadError = action.payload;
      });
  },
});

export default profileCompletionPageSlice.reducer;
