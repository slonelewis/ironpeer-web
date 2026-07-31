import { types as sdkTypes } from '../util/sdkLoader';

const { LatLng, LatLngBounds } = sdkTypes;

// An array of locations to show in the LocationAutocompleteInput when
// the input is in focus but the user hasn't typed in any search yet.
//
// Each item in the array should be an object with a unique `id` (String) and a
// `predictionPlace` (util.types.place) properties.
//
// NOTE: these are highly recommended, since they
//       1) help customers to find relevant locations, and
//       2) reduce the cost of using map providers geocoding API
const defaultLocations = [
  {
    id: 'default-ellensburg',
    predictionPlace: {
      address: 'Ellensburg, WA',
      bounds: new LatLngBounds(new LatLng(47.04, -120.44), new LatLng(46.94, -120.60)),
    },
  },
  {
    id: 'default-yakima',
    predictionPlace: {
      address: 'Yakima, WA',
      bounds: new LatLngBounds(new LatLng(46.65, -120.38), new LatLng(46.54, -120.62)),
    },
  },
  {
    id: 'default-spokane',
    predictionPlace: {
      address: 'Spokane, WA',
      bounds: new LatLngBounds(new LatLng(47.74, -117.27), new LatLng(47.59, -117.50)),
    },
  },
  {
    id: 'default-seattle',
    predictionPlace: {
      address: 'Seattle, WA',
      bounds: new LatLngBounds(new LatLng(47.74, -122.22), new LatLng(47.49, -122.46)),
    },
  },
  {
    id: 'default-washington',
    predictionPlace: {
      address: 'Washington State',
      bounds: new LatLngBounds(new LatLng(49.00, -116.92), new LatLng(45.54, -124.73)),
    },
  },
];
export default defaultLocations;
