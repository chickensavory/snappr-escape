import { PopupButton } from "@typeform/embed-react";

export default function TypeformGate() {
  return (
    <PopupButton
      id="YOUR_TYPEFORM_ID"        // e.g., form URL https://form.typeform.com/to/abcd -> id="abcd"
      size={80}                    // modal width %
      onReady={() => console.log("TF open")}
      onSubmit={() => console.log("TF submitted")}
    >
      Open Verification
    </PopupButton>
  );
}