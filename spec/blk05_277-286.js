// positions of a trigger element, all relative to the viewport
const poses = {
  top_top: bb.top, center_top: bb.top + bb.height / 2, bottom_top: bb.bottom,
  top_bottom: bb.top - vh, center_bottom: bb.top + bb.height / 2 - vh, bottom_bottom: bb.bottom - vh,
  top_center: bb.top - vh / 2, center_center: bb.top + bb.height / 2 - vh / 2, bottom_center: bb.bottom - vh / 2,
};
const scrollStart = poses[start], scrollEnd = poses[end];
const length = Math.abs(scrollStart - scrollEnd);
const progress = Math.min(Math.max(0, 1 - (scrollStart + length) / length), 1);