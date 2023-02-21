import { Outlet } from 'react-router-dom';
import { Flex, Container } from '@mantine/core';
import { NavbarMinimal } from '../components/Navbar';

export default function DefaultLayout() {
  return (
    <Flex style={{ minHeight: '100%' }}>
      <NavbarMinimal />
      <Container w="100%">
        <Outlet />
      </Container>
    </Flex>
  )
}