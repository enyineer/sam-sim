import { Button, TextInput, Text } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { closeAllModals, openModal } from '@mantine/modals';
import { z } from 'zod';
import { useFirebaseApp } from 'reactfire';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { showNotification } from '@mantine/notifications';
import { useUser } from 'reactfire';

export const openCreateStationModal = () => {
  openModal({
    title: 'Wache anlegen',
    children: <CreateStationModal />,
  });
}

function CreateStationModal() {
  const {status: userStatus, data: userData} = useUser();
  const app = useFirebaseApp();
  const firestore = getFirestore(app);
  const stationsCollection = collection(firestore, 'stations');

  if (userStatus !== 'success') {
    return (
      <Text>Loading...</Text>
    )
  }

  if (userData === null) {
    return (
      <Text>Unauthorized</Text>
    )
  }

  const schema = z.object({
    name: z.string().min(1),
  });
  const form = useForm({
    initialValues: {
      name: ''
    },
    validate: zodResolver(schema),
  });
  
  return (
    <form onSubmit={form.onSubmit(async (values) => {
      try {
        const newDoc = {
          name: values.name,
          ownerIds: [userData.uid]
        }

        await addDoc(stationsCollection, newDoc);

        showNotification({
          message: 'Wache angelegt',
          color: 'green',
        });
      } catch (err) {
        if (err instanceof Error) {
          showNotification({
            message: `Konnte Wache nicht angeleg: ${err.message}`,
            color: 'red',
          });
        }
        console.error(err);
      }
      closeAllModals();
    })}>
      <TextInput withAsterisk label="Name" placeholder="Name der Wache" {...form.getInputProps('name')} />
      <Button fullWidth mt="md" color="green" type="submit">
        Anlegen
      </Button>
    </form>
  )
}