import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Buildings, X } from "@phosphor-icons/react";
import { CampusObject, type CampusView } from "./campus-object";

const views: [CampusView, string][] = [
  ["entrance", "Главный вход"],
  ["wing", "Учебные корпуса"],
  ["courtyard", "Внутренний двор"],
];

export function CampusPreview({ className }: { className: string }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<CampusView>("entrance");
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) setView("entrance");
        setOpen(next);
      }}
    >
      <Dialog.Trigger className={className}>
        <Buildings size={18} aria-hidden="true" /> Кампус в 3D
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="news-dialog-backdrop" />
        <Dialog.Viewport className="news-dialog-viewport">
          <Dialog.Popup className="campus-view-dialog">
            <div className="campus-view-heading">
              <Dialog.Title>Северный кампус</Dialog.Title>
              <Dialog.Close className="secondary square" aria-label="Закрыть 3D-просмотр">
                <X size={22} aria-hidden="true" />
              </Dialog.Close>
            </div>
            <div className="campus-view-stage">
              {open && <CampusObject kind="campus" view={view} />}
            </div>
            <div className="campus-view-controls" role="group" aria-label="Ракурс кампуса">
              {views.map(([angle, label]) => (
                <button
                  key={angle}
                  type="button"
                  aria-pressed={angle === view}
                  className={angle === view ? "primary" : "secondary"}
                  onClick={() => setView(angle)}
                >
                  {label}
                </button>
              ))}
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
