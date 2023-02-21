import { Title, Flex, Text, Table, Button, CopyButton, ActionIcon, Tooltip } from '@mantine/core';
import { IconArrowRight, IconCopy } from '@tabler/icons-react';
import { collection, orderBy, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useFirestore, useUser, useFirestoreCollectionData } from 'reactfire';
import { openCreateStationModal } from '../components/modals/createStationModal';

export default function StationsPage() {
  const firestore = useFirestore();
  const stationsCollection = collection(firestore, 'stations');
  const {status: userStatus, data: userData} = useUser();
  const navigate = useNavigate();

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

  const stationsQuery = query(stationsCollection, where('ownerIds', 'array-contains', userData?.uid), orderBy('name', 'asc'));
  const {status: queryStatus, data: queryData} = useFirestoreCollectionData(stationsQuery, {
    idField: 'id',
  });

  if (queryStatus !== 'success') {
    return (
      <Text>Loading...</Text>
    )
  }

  const rows = queryData.map((doc) => (
    <tr key={doc.id}>
      <td>{doc.name}</td>
      <td>
        <Flex gap="xs">
          <CopyButton value={doc.id}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? 'id kopiert' : 'id kopieren'}>
                <ActionIcon color={copied ? 'teal' : 'blue'} onClick={copy}>
                  <IconCopy size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
          <Tooltip label="Zur Wache">
            <ActionIcon color="green" onClick={() => navigate(`/stations/${doc.id}`)}>
              <IconArrowRight size={16} />
            </ActionIcon>
          </Tooltip>
        </Flex>
      </td>
    </tr>
  ));

  return (
    <Flex direction="column" gap="md">
      <Title>Wachen</Title>
      {
        rows.length > 0 &&
        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </Table>
      }
      {
        rows.length === 0 &&
        <Text>Keine Wachen erstellt</Text>
      }
      <Button color="green" onClick={() => openCreateStationModal()}>Neu</Button>
    </Flex>
  );
}