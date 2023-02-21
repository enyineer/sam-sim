import { useNavigate, useSearchParams } from "react-router-dom";
import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
import {
  Flex,
  UnstyledButton,
  Title,
  Paper,
  Group,
  ThemeIcon,
  Text,
} from "@mantine/core";
import { useFirebaseApp } from "reactfire";
import { IconBrandGoogle } from "@tabler/icons-react";

export default function LoginPage() {
  const [urlParams] = useSearchParams({
    from: "/",
  });
  const navigate = useNavigate();
  const auth = getAuth(useFirebaseApp());
  const googleProvider = new GoogleAuthProvider();

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
    navigate(urlParams.get('from') || '/');
  };

  return (
    <Flex direction="column" h="100%" justify="center" align="center" gap="md">
      <Title>Login</Title>
      <Paper withBorder p="xs">
        <UnstyledButton onClick={() => signInWithGoogle()}>
          <Group>
            <ThemeIcon>
              <IconBrandGoogle size={16} />
            </ThemeIcon>
            <Text>Mit Google anmelden</Text>
          </Group>
        </UnstyledButton>
      </Paper>
    </Flex>
  );
}
