import React from 'react';

import css from './ProtectionBadge.module.css';

/**
 * ProtectionBadge renders a small badge indicating IronPeer equipment protection is included.
 *
 * @component
 */
const ProtectionBadge = () => {
  return (
    <div className={css.badge}>
      <span className={css.shieldIcon} aria-hidden="true">🛡️</span>
      <span className={css.badgeText}>IronPeer Protection included</span>
    </div>
  );
};

export default ProtectionBadge;
