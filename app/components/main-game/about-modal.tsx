import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { FooterAbout } from "./footer-about";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>About Dakon Clash</DialogTitle>
        </DialogHeader>
        <FooterAbout />
      </DialogContent>
    </Dialog>
  );
}
