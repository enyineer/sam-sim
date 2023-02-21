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
  Loader
} from "@mantine/core";
import { useFirebaseApp } from "reactfire";
import { IconBrandGoogle } from "@tabler/icons-react";
import { useState } from 'react';
import { showNotification } from '@mantine/notifications';

export default function LoginPage() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [urlParams] = useSearchParams({
    from: "/",
  });
  const navigate = useNavigate();
  const auth = getAuth(useFirebaseApp());
  const googleProvider = new GoogleAuthProvider();

  const signInWithGoogle = async () => {
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate(urlParams.get('from') || '/', { replace: true });
    } catch (err) {
      if (err instanceof Error) {
        showNotification({
          message: `Login fehlgeschlagen: ${err.message}`,
          color: 'red',
        });
      }
      console.log(err);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <Flex direction="column" h="100%" justify="center" align="center" gap="md">
      <Title>Login</Title>
      <Paper withBorder p="xs">
        <UnstyledButton onClick={() => signInWithGoogle()} disabled={isSigningIn}>
          <Group>
            { !isSigningIn &&
              <ThemeIcon>
                <IconBrandGoogle size={16} />
              </ThemeIcon>
            }
            {
              isSigningIn &&
              <ThemeIcon color="gray">
                <Loader size={16} />
              </ThemeIcon>
            }
            <Text>Mit Google anmelden</Text>
          </Group>
        </UnstyledButton>
      </Paper>
    </Flex>
  );
}
