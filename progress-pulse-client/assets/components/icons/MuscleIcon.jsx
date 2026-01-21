import React from 'react';

// paths match your tree: assets/images/svg/muscles/*.svg
import Abs       from '../../images/svg/muscles/abs.svg';
import Back      from '../../images/svg/muscles/back.svg';
import Biceps    from '../../images/svg/muscles/biceps.svg';
import Triceps   from '../../images/svg/muscles/triceps.svg';
import Forearms  from '../../images/svg/muscles/forearms.svg';
import Chest     from '../../images/svg/muscles/chest.svg';
import Shoulders from '../../images/svg/muscles/shoulders.svg';
import Legs      from '../../images/svg/muscles/legs.svg';

const MAP = {
  abs: Abs,
  back: Back,
  biceps: Biceps,
  triceps: Triceps,
  forearms: Forearms,
  chest: Chest,
  shoulders: Shoulders,
  legs: Legs,
};

export default function MuscleIcon({ idOrName, size = 40 /*, color*/ }) {
  const k = String(idOrName || '').toLowerCase();

  // find by key substring
  const key =
    Object.keys(MAP).find(m => k.includes(m)) ||
    (/(quad|hamstring|calf|leg)/.test(k) ? 'legs' : null);

  const Icon = key ? MAP[key] : Legs;

  // If you later convert SVGs to use `currentColor`, pass {color} here.
  // return <Icon width={size} height={size} color={color} />;
  return <Icon width={size} height={size} />;
}
