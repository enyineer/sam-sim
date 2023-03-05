import { ActionIcon, Button, Table, Text, Title } from "@mantine/core";
import { openConfirmModal } from "@mantine/modals";
import { showNotification } from '@mantine/notifications';
import { IconUserMinus, IconUserPlus } from "@tabler/icons-react";
import { useUser } from 'reactfire';
import { openAddOwnerModal } from "../../components/modals/addOwnerModal";
import { trpc } from "../../utils/trpc";

type OwnersProps = {
  stationId: string;
};

export default function Owners(props: OwnersProps) {
  const owners = trpc.stations.getOwners.useQuery({
    stationId: props.stationId,
  });
  const deleteOwnerMutation = trpc.stations.deleteOwner.useMutation();
  const { data: user } = useUser();

  if (!owners.data || user === null) {
    return <Text>Loading...</Text>;
  }

  const openConfirmRemoveOwnerModal = (uid: string) =>
    openConfirmModal({
      title: "Inhaber wirklich entfernen?",
      children: (
        <Text size="sm">Möchten Sie den Inhaber wirklich entfernen?</Text>
      ),
      labels: { confirm: "Entfernen", cancel: "Abbrechen" },
      onConfirm: async () => {
        try {
          await deleteOwnerMutation.mutateAsync({
            stationId: props.stationId,
            uid,
          });

          showNotification({
            message: 'Inhaber entfernt',
            color: 'green',
          });

          owners.refetch();
        } catch (err) {
          if (err instanceof Error) {
            showNotification({
              message: `Konnte Owner nicht anlegen: ${err.message}`,
              color: 'red',
            });
          }
          console.error(err);
        }
      },
    });

  const rows = owners.data.ownerUsers.map((owner) => {
    return (
      <tr key={owner.uid}>
        <td>{owner.uid}</td>
        <td>{owner.displayName || "N.A."}</td>
        <td>{owner.email || "N.A."}</td>
        <td>
          <ActionIcon
            ml="auto"
            color="red"
            onClick={() => {
              if (owner.uid === user.uid) {
                return showNotification({
                  message: 'Sie können sich nicht selbst entfernen',
                  color: 'red',
                });
              }
              openConfirmRemoveOwnerModal(owner.uid);
            }}
          >
            <IconUserMinus size={16} />
          </ActionIcon>
        </td>
      </tr>
    );
  });

  const onOwnerAdded = () => {
    owners.refetch();
  };

  return (
    <>
      <Title order={3}>Inhaber</Title>
      {rows.length > 0 && (
        <Table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>E-Mail</th>
              <th></th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </Table>
      )}
      {rows.length === 0 && <Text>Keine Inhaber</Text>}
      <Button
        leftIcon={<IconUserPlus size={18} />}
        color="green"
        onClick={() => {
          openAddOwnerModal({
            stationId: props.stationId,
            onSuccess: onOwnerAdded,
          });
        }}
      />
    </>
  );
}
