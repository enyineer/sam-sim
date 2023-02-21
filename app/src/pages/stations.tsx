import {
  Title,
  Flex,
  Text,
  Button,
  CopyButton,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { IconArrowRight, IconCirclePlus, IconCopy } from "@tabler/icons-react";
import { collection, orderBy, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useFirestore, useUser, useFirestoreCollectionData } from "reactfire";
import { openCreateStationModal } from "../components/modals/createStationModal";

export default function StationsPage() {
  const { status: userStatus, data: userData } = useUser();
  const navigate = useNavigate();
  const firestore = useFirestore();
  const stationsCollection = collection(firestore, "stations");

  if (userStatus !== "success") {
    return <Text>Loading...</Text>;
  }

  if (userData === null || !userData.uid) {
    return <Text>Unauthorized</Text>;
  }

  const stationsQuery = query(
    stationsCollection,
    where("ownerIds", "array-contains", userData.uid),
    orderBy("name", "asc")
  );
  const { status: queryStatus, data: queryData } = useFirestoreCollectionData(
    stationsQuery,
    {
      idField: "id",
    }
  );

  if (queryStatus !== "success") {
    return <Text>Loading...</Text>;
  }

  const rows = queryData.map((doc) => (
    <Flex key={doc.id} justify="space-between">
      <Text>{doc.name}</Text>
      <Flex gap="xs">
        <CopyButton value={doc.id}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? "id kopiert" : "id kopieren"}>
              <ActionIcon color={copied ? "teal" : "blue"} onClick={copy}>
                <IconCopy size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
        <Tooltip label="Zur Wache">
          <ActionIcon
            color="green"
            onClick={() => navigate(`/stations/${doc.id}`)}
          >
            <IconArrowRight size={16} />
          </ActionIcon>
        </Tooltip>
      </Flex>
    </Flex>
  ));

  return (
    <Flex direction="column" gap="md">
      <Title>Wachen</Title>
      {rows}
      {rows.length === 0 && <Text>Keine Wachen erstellt</Text>}
      <Button leftIcon={<IconCirclePlus size={18} />} color="green" onClick={() => openCreateStationModal()} />
    </Flex>
  );
}
