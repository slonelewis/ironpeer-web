import React, { useState, useEffect } from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';

import { AspectRatioWrapper, Promised } from '../../components';

import css from './ImageFromFile.module.css';

// readImage returns a promise which resolves to an object URL for the file.
// Using URL.createObjectURL() is faster, memory-efficient, and works reliably
// on iOS Safari where FileReader.readAsDataURL() can fail on large JPEGs.
const readImage = file =>
  new Promise((resolve, reject) => {
    try {
      if (!file || !(file instanceof Blob)) {
        reject(new Error(`Invalid file: ${file?.name}`));
        return;
      }
      const objectURL = URL.createObjectURL(file);
      resolve(objectURL);
    } catch (e) {
      console.error(`Error creating object URL for ${file?.name}:`, e);
      reject(new Error(`Error reading ${file?.name}: ${e.message}`));
    }
  });

/**
 * Create image component from the given image file.
 * Note: currently this relies on dataURL.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.id
 * @param {number?} props.aspectWidth
 * @param {number?} props.aspectHeight
 * @param {File?} props.file from <input type="file" />
 * @param {ReactNode?} props.children
 * @returns {JSX.Element} SVG icon
 */
const ImageFromFile = props => {
  const [promisedImage, setPromisedImage] = useState(readImage(props.file));
  const { className, rootClassName, aspectWidth = 1, aspectHeight = 1, file, id, children } = props;

  // Revoke the object URL when the component unmounts to free memory
  useEffect(() => {
    return () => {
      promisedImage.then(url => {
        if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
      }).catch(() => {});
    };
  }, []);
  const classes = classNames(rootClassName || css.root, className);

  return (
    <Promised
      key={id}
      promise={promisedImage}
      renderFulfilled={dataURL => {
        return (
          <div className={classes}>
            <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
              <img src={dataURL} alt={file.name} className={css.rootForImage} />
            </AspectRatioWrapper>
            {children}
          </div>
        );
      }}
      renderRejected={() => (
        <div className={classes}>
          <FormattedMessage id="ImageFromFile.couldNotReadFile" />
        </div>
      )}
    />
  );
};

export default ImageFromFile;
