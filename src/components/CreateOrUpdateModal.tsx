import { useEffect, useState } from "react";
import { Modal, TextInput, Group, Button } from "@mantine/core";

interface CreateOrUpdateModalProps {
  opened: boolean;
  modalTitle: string;
  inputLabel: string;
  title?: string;
  buttonLabel?: string;
  onSubmit?:
    | ((newTitle: string) => void)
    | ((newTitle: string) => Promise<void>);
  onClose?: (() => void) | (() => Promise<void>);
}

export function CreateOrUpdateModal({
  opened,
  modalTitle,
  inputLabel,
  title = "",
  buttonLabel = "Create",
  onSubmit = () => {},
  onClose = () => {},
}: CreateOrUpdateModalProps) {
  const [newTitle, setNewTitle] = useState(title);

  useEffect(() => {
    setNewTitle(title);
  }, [title]);

  return (
    <Modal opened={opened} onClose={onClose} title={modalTitle} centered>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await onSubmit(newTitle);
          setNewTitle("");
        }}
      >
        <TextInput
          autoFocus={true}
          label={inputLabel}
          placeholder={inputLabel}
          value={newTitle}
          onChange={(event) => setNewTitle(event.currentTarget.value)}
        />
        <Group justify="flex-end" mt={24}>
          <Button type="submit">{buttonLabel}</Button>
        </Group>
      </form>
    </Modal>
  );
}
