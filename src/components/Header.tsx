import React from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { Container } from 'react-bootstrap';

import { useAuthContext } from "../hooks/useAuth";


export default function Header() {
    const { user } = useAuthContext();

    return (
        <Container className='w-100 m-2'>
            <Row className='w-100 m-2'>
                <Col xs={4} className="p-0">
                    {user &&
                        <div className='text-center d-inline align-middle'>
                            {user?.profilePicture &&
                                <img
                                    alt="Avatar"
                                    className="d-inline-block align-top"
                                    src={user.profilePicture}
                                    style={{ height: 30, width: 30, borderRadius: 5 }}
                                />}

                            <span style={{ fontSize: 15, padding: 10 }}>{user.username}</span>
                        </div>}
                </Col>

                <Col xs={4} className='text-center p-0'>
                    <img
                        className="d-inline-block align-top"
                        src={"/assets/logo.png"}
                        style={{ borderRadius: 5, height: 20, width: 20 }}
                    />

                    <span
                        className='text-center align-middle p-2'
                        style={{ fontSize: 20, whiteSpace: "nowrap" }}
                    >
                        Fedi-Feed
                    </span>
                </Col>

                <Col className='text-end p-0'>
                    {user &&
                        <Button className='p-2 text-center' variant="outline-primary" href="/logout">
                            Logout
                        </Button>}
                </Col>
            </Row>
        </Container>
    );
};
