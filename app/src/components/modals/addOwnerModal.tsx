import { Button, Input } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { closeAllModals, openModal } from '@mantine/modals';
import { z } from 'zod';
import { showNotification } from '@mantine/notifications';
import { trpc } from '../../utils/trpc';

type AddOwnerModalProps = {
  stationId: string;
  onSuccess?: () => void;
}

export const openAddOwnerModal = (props: AddOwnerModalProps) => {
  openModal({
    title: 'Inhaber hinzufügen',
    children: <AddOwnerModal {...props} />,
    zIndex: 1000,
  });
}

function AddOwnerModal(props: AddOwnerModalProps) {
  const addOwnerMutation = trpc.stations.addOwner.useMutation();

  const schema = z.object({
    email: z.string().email(),
  });
  const form = useForm({
    initialValues: {
      email: '',
    },
    validate: zodResolver(schema),
  });
  
  return (
    <form onSubmit={form.onSubmit(async (values) => {
      try {
        await addOwnerMutation.mutateAsync({
          email: values.email,
          stationId: props.stationId,
        });

        showNotification({
          message: 'Owner angelegt',
          color: 'green',
        });

        if (props.onSuccess) {
          props.onSuccess();
        }
      } catch (err) {
        if (err instanceof Error) {
          showNotification({
            message: `Konnte Owner nicht anlegen: ${err.message}`,
            color: 'red',
          });
        }
        console.error(err);
      }
      closeAllModals();
    })}>
      <Input placeholder="E-Mail" {...form.getInputProps('email')} />
      <Button fullWidth mt="md" color="green" type="submit">
        Hinzufügen
      </Button>
    </form>
  )
}