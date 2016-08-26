export enum AnimationState {
	// Used for when elements transition in and out (i.e., the next element is replacing the first)
	GoingIn,   // Element currently animating in
	GoingOut,  // Element currently animating out
	In,        // No animation, element is in
	Out,       // No animation, element is out

	// Used for when the same element is transitioning from one state to the next (e.g., changing dimensions)
	Transitioning,
	Stopped
}
