import { Button, Radio, Text, Textarea, Flex } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { closeAllModals, openModal } from '@mantine/modals';
import { z } from 'zod';
import { useFirebaseApp } from 'reactfire';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { showNotification } from '@mantine/notifications';
import { useUser } from 'reactfire';
import { AlarmType } from './AlarmType';

type CreateAlarmModalProps = {
  stationId: string;
}

export const openCreateAlarmModal = (props: CreateAlarmModalProps) => {
  openModal({
    title: 'Alarm ausführen',
    children: <CreateAlarmModal {...props} />,
    zIndex: 1000,
  });
}

function CreateAlarmModal(props: CreateAlarmModalProps) {
  const {status: userStatus, data: userData} = useUser();
  const app = useFirebaseApp();
  const firestore = getFirestore(app);
  const alarmsCollection = collection(firestore, 'stations', props.stationId, 'alarms');

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
    type: z.nativeEnum(AlarmType),
    ttsText: z.string(),
  });
  const form = useForm({
    initialValues: {
      type: AlarmType.KEINER,
      ttsText: '',
    },
    validate: zodResolver(schema),
  });
  
  return (
    <form onSubmit={form.onSubmit(async (values) => {
      try {
        const newDoc = {
          type: values.type,
          ttsText: values.ttsText,
          createdAt: Date.now(),
        }

        await addDoc(alarmsCollection, newDoc);

        showNotification({
          message: 'Alarm angelegt',
          color: 'green',
        });
      } catch (err) {
        if (err instanceof Error) {
          showNotification({
            message: `Konnte Alarm nicht angeleg: ${err.message}`,
            color: 'red',
          });
        }
        console.error(err);
      }
      closeAllModals();
    })}>
      <Radio.Group
        label="Alarmart"
        withAsterisk
        {...form.getInputProps('type')}
      >
        <Flex direction="column" gap="xs">
          {(Object.keys(AlarmType) as Array<keyof typeof AlarmType>).map((key) => {
            return (
              <Radio
                key={key}
                value={key}
                label={key}
              />
            )
          })}
        </Flex>
      </Radio.Group>
      <Textarea label="Alarmmeldung" placeholder="Optionaler Alarmierungstext" {...form.getInputProps('ttsText')} />
      <Button fullWidth mt="md" color="green" type="submit">
        Alarmieren
      </Button>
    </form>
  )
}