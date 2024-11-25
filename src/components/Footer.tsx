import React from "react";

import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/esm/Navbar";
import Container from "react-bootstrap/Container";


export default function Footer() {
    return (
        <Navbar expand="lg" className="bg-body-tertiary" bg="dark" data-bs-theme="dark" style={{marginTop: '50px'}}>
            <Container>
                <Navbar.Brand style={{ color: "white" }}>FediFeed</Navbar.Brand>

                <Nav className="me-auto">
                    <Nav.Link href="/" style={{ color: "white" }}>Home</Nav.Link>

                    <Nav.Link href="https://github.com/michelcrypt4d4mus/fedialgo_demo_app_foryoufeed" style={{ color: "white" }}>
                        <img
                            alt="Github Logo"
                            className="d-inline-block align-top"
                            src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                            style={{ height: 20, width: 20, borderRadius: 5 }}
                        />

                        <span className="p-2"> Code on Github</span>
                    </Nav.Link>

                    <Nav.Link href="https://chaos.social/@pkreissel" style={{ color: "white" }}>
                        <img
                            alt="Chaos.social Logo"
                            className="d-inline-block align-top"
                            src="https://assets.chaos.social/accounts/avatars/000/242/007/original/97b58ba7002b2c8b.jpg"
                            style={{ height: 20, width: 20, borderRadius: 5 }}
                        />

                        <span className="p-2"> Follow me on Mastodon</span>
                    </Nav.Link>
                </Nav>
            </Container>
        </Navbar>
    );
};
