import Mathlib.Basic.Real.Basic

theorem positive_of_equal_wrong (a b : ℝ) (h : a = b) : 0 < a := by
  trace_state
  exact h
