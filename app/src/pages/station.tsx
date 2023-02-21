import { useParams } from 'react-router-dom';
import { Text, Flex, Title, Button, Table } from '@mantine/core';
import { useFirestore, useFirestoreDocData, useFirestoreCollectionData } from 'reactfire';
import { collection, doc, orderBy, query } from 'firebase/firestore';
import { IconAlarmPlus } from '@tabler/icons-react';
import { openCreateAlarmModal } from '../components/modals/createAlarmModal';

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
  const { status: alarmsStatus, data: alarmsDocs } = useFirestoreCollectionData(
    query(collection(firestore, "stations", stationId, "alarms"), orderBy('createdAt', 'desc')),
    {
      idField: "id",
    }
  );
  
  if (stationStatus !== 'success' || alarmsStatus !== 'success') {
    return (
      <Text>Loading...</Text>
    )
  }

  const rows = alarmsDocs.map((doc) => {
    const dateString = new Date(doc.createdAt).toLocaleString();
    
    return (
      <tr key={doc.id}>
        <td>{doc.type}</td>
        <td>{doc.ttsText}</td>
        <td>{dateString}</td>
      </tr>
    )
  });

  return (
    <Flex direction="column">
      <Title>{stationDoc.name}</Title>
      <Title order={3}>Alarme</Title>
      {rows.length > 0 &&
        <Table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Text</th>
              <th>Datum</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </Table>
      }
      {rows.length === 0 && <Text>Keine Alarme erstellt</Text>}
      <Button leftIcon={<IconAlarmPlus size={18} />} color="green" onClick={() => openCreateAlarmModal({ stationId: stationDoc.id })} />
    </Flex>
  );
}