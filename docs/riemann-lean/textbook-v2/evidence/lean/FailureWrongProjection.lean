import Mathlib.Basic.Real.Basic

theorem conjunction_wrong_projection (P Q : Prop) (h : P ∧ Q) : Q := by
  trace_state
  exact h.1
