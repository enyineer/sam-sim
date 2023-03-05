import { Button, Table, Text, Title } from "@mantine/core";
import { IconAlarmPlus } from "@tabler/icons-react";
import { collection, orderBy, query } from "firebase/firestore";
import { useFirestore, useFirestoreCollectionData } from "reactfire";
import { openCreateAlarmModal } from "../../components/modals/createAlarmModal";

type AlarmProps = {
  stationId: string;
};

export default function Alarms(props: AlarmProps) {
  const firestore = useFirestore();
  const { status: alarmsStatus, data: alarmsDocs } = useFirestoreCollectionData(
    query(
      collection(firestore, "stations", props.stationId, "alarms"),
      orderBy("createdAt", "desc")
    ),
    {
      idField: "id",
    }
  );

  if (alarmsStatus !== "success") {
    return <Text>Loading...</Text>;
  }

  const rows = alarmsDocs.map((doc) => {
    const dateString = new Date(doc.createdAt).toLocaleString();

    return (
      <tr key={doc.id}>
        <td>{doc.type}</td>
        <td>{doc.ttsText}</td>
        <td>{dateString}</td>
      </tr>
    );
  });

  return (
    <>
      <Title order={3}>Alarme</Title>
      {rows.length > 0 && (
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
      )}
      {rows.length === 0 && <Text>Keine Alarme erstellt</Text>}
      <Button
        leftIcon={<IconAlarmPlus size={18} />}
        color="green"
        onClick={() => openCreateAlarmModal({ stationId: props.stationId })}
      />
    </>
  );
}
