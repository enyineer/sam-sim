import { useParams } from 'react-router-dom';
import { Text, Flex, Title } from '@mantine/core';
import { useFirestore, useFirestoreDocData } from 'reactfire';
import { doc } from 'firebase/firestore';
import Alarms from './alarms';
import Owners from './owners';

export default function StationPage() {
  let { stationId } = useParams();
  if (stationId === undefined) {
    return (
      <Text>stationId nicht gefunden.</Text>
    )
  }

  const firestore = useFirestore();
  const { status: stationStatus, data: stationDoc } = useFirestoreDocData(doc(firestore, 'stations', stationId), {
    idField: 'id',
  });
  
  if (stationStatus !== 'success') {
    return (
      <Text>Loading...</Text>
    )
  }

  return (
    <Flex direction="column" gap="md">
      <Title>{stationDoc.name}</Title>
      <Owners stationId={stationDoc.id} />
      <Alarms stationId={stationDoc.id} />
    </Flex>
  );
}