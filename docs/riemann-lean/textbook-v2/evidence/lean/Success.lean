import Mathlib.Basic.Real.Basic

set_option pp.universes false

theorem identity_demo (P : Prop) : P → P := by
  trace_state
  intro h
  trace_state
  exact h

theorem conjunction_demo (P Q : Prop) : P ∧ Q → Q ∧ P := by
  trace_state
  intro h
  trace_state
  exact ⟨h.2, h.1⟩

theorem equality_demo (a b : ℝ) : a = b → b = a := by
  trace_state
  intro h
  trace_state
  exact h.symm

theorem positive_of_equal (a b : ℝ) : a = b → 0 < b → 0 < a := by
  trace_state
  intro h
  trace_state
  intro hab
  trace_state
  rw [h]
  trace_state
  exact hab

theorem zero_add_demo (n : ℕ) : 0 + n = n := by
  trace_state
  simp

#print axioms identity_demo
#print axioms conjunction_demo
#print axioms equality_demo
#print axioms positive_of_equal
#print axioms zero_add_demo
