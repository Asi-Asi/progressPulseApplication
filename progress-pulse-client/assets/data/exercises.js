// assets/data/exercises.js
// רשימת תרגילים לכל קבוצת שרירים (דמו סטטי) — אפשר להחליף ל-API בעתיד

export const EXERCISES_BY_MUSCLE = {
  chest: [
    { id: 'bench_press',        name: 'Barbell Bench Press',       equipment: 'Barbell',      level: 'Intermediate', type: 'Compound' },
    { id: 'incline_db_press',   name: 'Incline Dumbbell Press',    equipment: 'Dumbbells',    level: 'Intermediate', type: 'Compound' },
    { id: 'push_up',            name: 'Push-Up',                   equipment: 'Bodyweight',   level: 'Beginner',     type: 'Bodyweight' },
    { id: 'db_fly',             name: 'Dumbbell Fly',              equipment: 'Dumbbells',    level: 'Beginner',     type: 'Isolation' },
    { id: 'cable_crossover',    name: 'Cable Crossover',           equipment: 'Cable',        level: 'Beginner',     type: 'Isolation' },
    { id: 'chest_dip',          name: 'Chest Dip',                 equipment: 'Parallel Bars',level: 'Intermediate', type: 'Bodyweight' },
  ],

  back: [
    { id: 'deadlift',           name: 'Deadlift',                  equipment: 'Barbell',      level: 'Intermediate', type: 'Compound' },
    { id: 'pull_up',            name: 'Pull-Up',                   equipment: 'Bodyweight',   level: 'Intermediate', type: 'Bodyweight' },
    { id: 'lat_pulldown',       name: 'Lat Pulldown',              equipment: 'Machine',      level: 'Beginner',     type: 'Compound' },
    { id: 'bent_over_row',      name: 'Bent-Over Row',             equipment: 'Barbell',      level: 'Intermediate', type: 'Compound' },
    { id: 'seated_row',         name: 'Seated Cable Row',          equipment: 'Cable',        level: 'Beginner',     type: 'Compound' },
    { id: 'face_pull',          name: 'Face Pull',                 equipment: 'Cable',        level: 'Beginner',     type: 'Isolation' },
  ],

  shoulders: [
    { id: 'ohp',                name: 'Overhead Press',            equipment: 'Barbell',      level: 'Intermediate', type: 'Compound' },
    { id: 'lateral_raise',      name: 'Dumbbell Lateral Raise',    equipment: 'Dumbbells',    level: 'Beginner',     type: 'Isolation' },
    { id: 'front_raise',        name: 'Front Raise',               equipment: 'Dumbbells',    level: 'Beginner',     type: 'Isolation' },
    { id: 'rear_delt_fly',      name: 'Rear Delt Fly',             equipment: 'Dumbbells',    level: 'Beginner',     type: 'Isolation' },
    { id: 'arnold_press',       name: 'Arnold Press',              equipment: 'Dumbbells',    level: 'Intermediate', type: 'Compound' },
    { id: 'upright_row',        name: 'Upright Row',               equipment: 'Barbell',      level: 'Intermediate', type: 'Compound' },
  ],

  biceps: [
    { id: 'barbell_curl',       name: 'Barbell Curl',              equipment: 'Barbell',      level: 'Beginner',     type: 'Isolation' },
    { id: 'hammer_curl',        name: 'Hammer Curl',               equipment: 'Dumbbells',    level: 'Beginner',     type: 'Isolation' },
    { id: 'incline_db_curl',    name: 'Incline DB Curl',           equipment: 'Dumbbells',    level: 'Beginner',     type: 'Isolation' },
    { id: 'preacher_curl',      name: 'Preacher Curl',             equipment: 'Machine/Bench',level: 'Beginner',     type: 'Isolation' },
    { id: 'cable_curl',         name: 'Cable Curl',                equipment: 'Cable',        level: 'Beginner',     type: 'Isolation' },
  ],

  triceps: [
    { id: 'skull_crusher',      name: 'Skull Crushers',            equipment: 'Barbell/DB',   level: 'Intermediate', type: 'Isolation' },
    { id: 'pushdown',           name: 'Triceps Pushdown',          equipment: 'Cable',        level: 'Beginner',     type: 'Isolation' },
    { id: 'oh_triceps_ext',     name: 'Overhead Triceps Extension',equipment: 'Dumbbell',     level: 'Beginner',     type: 'Isolation' },
    { id: 'close_grip_bench',   name: 'Close-Grip Bench Press',    equipment: 'Barbell',      level: 'Intermediate', type: 'Compound' },
    { id: 'bench_dips',         name: 'Bench Dips',                equipment: 'Bodyweight',   level: 'Beginner',     type: 'Bodyweight' },
  ],

  forearms: [
    { id: 'wrist_curl',         name: 'Wrist Curl',                equipment: 'Barbell/DB',   level: 'Beginner',     type: 'Isolation' },
    { id: 'rev_wrist_curl',     name: 'Reverse Wrist Curl',        equipment: 'Barbell/DB',   level: 'Beginner',     type: 'Isolation' },
    { id: 'farmers_walk',       name: "Farmer's Carry",            equipment: 'Dumbbells',    level: 'Beginner',     type: 'Carry' },
    { id: 'reverse_curl',       name: 'Reverse Curl',              equipment: 'Barbell/DB',   level: 'Beginner',     type: 'Isolation' },
  ],

  abs: [
    { id: 'plank',              name: 'Plank',                     equipment: 'Bodyweight',   level: 'Beginner',     type: 'Isometric' },
    { id: 'crunch',             name: 'Crunch',                    equipment: 'Bodyweight',   level: 'Beginner',     type: 'Isolation' },
    { id: 'hanging_leg_raise',  name: 'Hanging Leg Raise',         equipment: 'Bar',          level: 'Intermediate', type: 'Isolation' },
    { id: 'russian_twist',      name: 'Russian Twist',             equipment: 'Bodyweight',   level: 'Beginner',     type: 'Isolation' },
    { id: 'cable_crunch',       name: 'Cable Crunch',              equipment: 'Cable',        level: 'Beginner',     type: 'Isolation' },
    { id: 'bicycle_crunch',     name: 'Bicycle Crunch',            equipment: 'Bodyweight',   level: 'Beginner',     type: 'Isolation' },
  ],

  legs: [
    { id: 'back_squat',         name: 'Back Squat',                equipment: 'Barbell',      level: 'Intermediate', type: 'Compound' },
    { id: 'romanian_dl',        name: 'Romanian Deadlift',         equipment: 'Barbell',      level: 'Intermediate', type: 'Compound' },
    { id: 'leg_press',          name: 'Leg Press',                 equipment: 'Machine',      level: 'Beginner',     type: 'Compound' },
    { id: 'walking_lunge',      name: 'Walking Lunge',             equipment: 'Dumbbells',    level: 'Beginner',     type: 'Compound' },
    { id: 'leg_extension',      name: 'Leg Extension',             equipment: 'Machine',      level: 'Beginner',     type: 'Isolation' },
    { id: 'calf_raise',         name: 'Standing Calf Raise',       equipment: 'Machine/DB',   level: 'Beginner',     type: 'Isolation' },
  ],
};

// פונקציה נוחה לשליפה
export const getExercisesFor = (muscleId) => EXERCISES_BY_MUSCLE[muscleId] ?? [];
