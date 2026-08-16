Footers:

import { Section, Img, Text, Row, Column, Link } from "@react-email/components";

<Section style={{ textAlign: 'center' }}>
  <table style={{ width: '100%' }}>
    <tr style={{ width: '100%' }}>
      <td align="center">
        <Img
          alt="React Email logo"
          height="42"
          src="https://react.email/static/logo-without-background.png"
          width="42"
        />
      </td>
    </tr>
    <tr style={{ width: '100%' }}>
      <td align="center">
        <Text
          style={{
            marginTop: 8,
            marginBottom: 8,
            fontSize: 16,
            lineHeight: '24px',
            fontWeight: 600,
            color: 'rgb(17,24,39)',
          }}
        >
          Acme corporation
        </Text>
        <Text
          style={{
            marginTop: 4,
            marginBottom: '0px',
            fontSize: 16,
            lineHeight: '24px',
            color: 'rgb(107,114,128)',
          }}
        >
          Think different
        </Text>
      </td>
    </tr>
    <tr>
      <td align="center">
        <Row
          style={{
            display: 'table-cell',
            height: 44,
            width: 56,
            verticalAlign: 'bottom',
          }}
        >
          <Column style={{ paddingRight: 8 }}>
            <Link href="#">
              <Img
                alt="Facebook"
                height="36"
                src="https://react.email/static/facebook-logo.png"
                width="36"
              />
            </Link>
          </Column>
          <Column style={{ paddingRight: 8 }}>
            <Link href="#">
              <Img alt="X" height="36" src="https://react.email/static/x-logo.png" width="36" />
            </Link>
          </Column>
          <Column>
            <Link href="#">
              <Img
                alt="Instagram"
                height="36"
                src="https://react.email/static/instagram-logo.png"
                width="36"
              />
            </Link>
          </Column>
        </Row>
      </td>
    </tr>
    <tr>
      <td align="center">
        <Text
          style={{
            marginTop: 8,
            marginBottom: 8,
            fontSize: 16,
            lineHeight: '24px',
            fontWeight: 600,
            color: 'rgb(107,114,128)',
          }}
        >
          123 Main Street Anytown, CA 12345
        </Text>
        <Text
          style={{
            marginTop: 4,
            marginBottom: '0px',
            fontSize: 16,
            lineHeight: '24px',
            fontWeight: 600,
            color: 'rgb(107,114,128)',
          }}
        >
          mail@example.com +123456789
        </Text>
      </td>
    </tr>
  </table>
</Section>

import { Section, Row, Column, Img, Text, Link } from "@react-email/components";

<Section>
  <Row>
    <Column colSpan={4}>
      <Img
        alt="React Email logo"
        height="42"
        src="https://react.email/static/logo-without-background.png"
      />
      <Text
        style={{
          marginTop: 8,
          marginBottom: 8,
          fontSize: 16,
          lineHeight: '24px',
          fontWeight: 600,
          color: 'rgb(17,24,39)',
        }}
      >
        Acme corporation
      </Text>
      <Text
        style={{
          marginTop: 4,
          marginBottom: '0px',
          fontSize: 16,
          lineHeight: '24px',
          color: 'rgb(107,114,128)',
        }}
      >
        Think different
      </Text>
    </Column>
    <Column
      align="left"
      style={{ display: 'table-cell', verticalAlign: 'bottom' }}
    >
      <Row
        style={{
          display: 'table-cell',
          height: 44,
          width: 56,
          verticalAlign: 'bottom',
        }}
      >
        <Column style={{ paddingRight: 8 }}>
          <Link href="#">
            <Img
              alt="Facebook"
              height="36"
              src="https://react.email/static/facebook-logo.png"
              width="36"
            />
          </Link>
        </Column>
        <Column style={{ paddingRight: 8 }}>
          <Link href="#">
            <Img alt="X" height="36" src="https://react.email/static/x-logo.png" width="36" />
          </Link>
        </Column>
        <Column>
          <Link href="#">
            <Img
              alt="Instagram"
              height="36"
              src="https://react.email/static/instagram-logo.png"
              width="36"
            />
          </Link>
        </Column>
      </Row>
      <Row>
        <Text
          style={{
            marginTop: 8,
            marginBottom: 8,
            fontSize: 16,
            lineHeight: '24px',
            fontWeight: 600,
            color: 'rgb(107,114,128)',
          }}
        >
          123 Main Street Anytown, CA 12345
        </Text>
        <Text
          style={{
            marginTop: 4,
            marginBottom: '0px',
            fontSize: 16,
            lineHeight: '24px',
            fontWeight: 600,
            color: 'rgb(107,114,128)',
          }}
        >
          mail@example.com +123456789
        </Text>
      </Row>
    </Column>
  </Row>
</Section>

Containers:

import { Container, Text } from "@react-email/components";

<Container style={{ backgroundColor: 'rgb(156,163,175)' }}>
  <Text
    style={{ color: 'rgb(255,255,255)', paddingLeft: 12, paddingRight: 12 }}
  >
    Hello, I am a container. I keep content centered and maintain it to a
    maximum width while still taking up as much space as possible!
  </Text>
</Container>

sections:

import { Section, Text } from "@react-email/components";

<Section>
  <Text>Hello my section!</Text>
</Section>


import { Section, Row, Column } from "@react-email/components";

<Section>
  <Row>
    <Column>Column 1, Row 1</Column>
    <Column>Column 2, Row 1</Column>
  </Row>
  <Row>
    <Column>Column 1, Row 2</Column>
    <Column>Column 2, Row 2</Column>
  </Row>
</Section>

Grids:
import { Row, Column } from "@react-email/components";

<>
  <Row cellSpacing={8}>
    <Column
      align="center"
      style={{
        width: '50%',
        height: 40,
        backgroundColor: 'rgb(52,211,153,0.6)',
      }}
    >
      1/2
    </Column>
    <Column
      align="center"
      style={{
        width: '50%',
        height: 40,
        backgroundColor: 'rgb(34,211,238,0.6)',
      }}
    >
      1/2
    </Column>
  </Row>
  <Row>
    <Column
      align="center"
      style={{
        width: '33.333333%',
        height: 40,
        backgroundColor: 'rgb(244,114,182,0.6)',
      }}
    >
      1/3
    </Column>
    <Column
      align="center"
      style={{
        width: '66.666667%',
        height: 40,
        backgroundColor: 'rgb(192,132,252,0.6)',
      }}
    >
      2/3
    </Column>
  </Row>
</>

import { Row, Column } from "@react-email/components";

<Row>
  <Column
    align="center"
    style={{
      width: '33.333333%',
      height: 40,
      backgroundColor: 'rgb(251,146,60,0.6)',
    }}
  >
    1/3
  </Column>
  <Column
    align="center"
    style={{
      width: '33.333333%',
      height: 40,
      backgroundColor: 'rgb(52,211,153,0.6)',
    }}
  >
    1/3
  </Column>
  <Column
    align="center"
    style={{
      width: '33.333333%',
      height: 40,
      backgroundColor: 'rgb(34,211,238,0.6)',
    }}
  >
    1/3
  </Column>
</Row>


Dividers:

import { Text, Hr } from "@react-email/components";

<>
  <Text>Before divider</Text>
  <Hr
    style={{
      marginTop: 16,
      borderColor: 'rgb(209,213,219)',
      marginBottom: 16,
      borderTopWidth: 2,
    }}
  />
  <Text>After divider</Text>
</>

import { Row, Column, Hr } from "@react-email/components";

<>
  <Row>
    <Column>First column</Column>
    <Column>Second column</Column>
  </Row>
  <Hr
    style={{
      marginTop: 16,
      borderColor: 'rgb(209,213,219)',
      marginBottom: 16,
    }}
  />
  <Row>
    <Column>First column</Column>
    <Column>Second column</Column>
  </Row>
</>

HEadings:

import { Heading } from "@react-email/components";

<Heading style={{ textAlign: 'center' }}>Ray Tomlinson</Heading>

import { Heading } from "@react-email/components";

<>
  <Heading as="h1" style={{ textAlign: 'center' }}>
    Jordan Walke
  </Heading>
  <Heading as="h2" style={{ textAlign: 'center' }}>
    Andrew Clark
  </Heading>
  <Heading as="h3" style={{ textAlign: 'center' }}>
    Dan Abramov
  </Heading>
  <Heading as="h4" style={{ textAlign: 'center' }}>
    Jason Bonta
  </Heading>
  <Heading as="h5" style={{ textAlign: 'center' }}>
    Joe Savona
  </Heading>
  <Heading as="h6" style={{ textAlign: 'center' }}>
    Josh Story
  </Heading>
</>


Text:

import { Text } from "@react-email/components";

<Text>A simple paragraph</Text>

import { Text } from "@react-email/components";

<>
  <Text
    style={{
      color: 'rgb(129,140,248)',
      fontSize: 24,
      lineHeight: '32px',
      fontWeight: 600,
    }}
  >
    Amazing content
  </Text>
  <Text>
    This is the actual content that the accented text above refers to.
  </Text>
</>

Links:

import { Link } from "@react-email/components";

<Link href="https://react.email">React Email</Link>


import { Text, Link } from "@react-email/components";

<Text>
  This is <Link href="https://react.email">React Email</Link>
</Text>


Buttons:

import { Button } from "@react-email/components";

<Button
  href="https://react.email"
  style={{
    width: '100%',
    boxSizing: 'border-box',
    padding: 12,
    fontWeight: 600,
    borderRadius: 8,
    textAlign: 'center',
    backgroundColor: 'rgb(79,70,229)',
    color: 'rgb(255,255,255)',
  }}
>
  Get started
</Button>

import { Row, Column, Button } from "@react-email/components";

<Row>
  <Column align="center">
    <Row>
      <td
        align="center"
        colSpan={1}
        style={{ paddingRight: 16, width: '50%' }}
      >
        <Button
          href="https://react.email"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 12,
            paddingBottom: 12,
            borderRadius: 8,
            backgroundColor: 'rgb(79,70,229)',
            textAlign: 'center',
            fontWeight: 600,
            color: 'rgb(255,255,255)',
          }}
        >
          Login
        </Button>
      </td>
      <td
        align="center"
        colSpan={1}
        style={{ paddingLeft: 16, width: '50%' }}
      >
        <Button
          href="https://react.email"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 12,
            paddingBottom: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: 'rgb(229,231,235)',
            textAlign: 'center',
            backgroundColor: 'rgb(255,255,255)',
            fontWeight: 600,
            color: 'rgb(17,24,39)',
          }}
        >
          Sign up
        </Button>
      </td>
    </Row>
  </Column>
</Row>

import { Row, Column, Text, Button, Img } from "@react-email/components";

<Row>
  <Column align="center">
    <Row>
      <Text
        style={{
          color: 'rgb(99,102,241)',
          fontWeight: 700,
          fontSize: 18,
          lineHeight: '28px',
        }}
      >
        Try now
      </Text>
      <Text
        style={{
          color: 'rgb(17,24,39)',
        }}
      >
        The app all cheese enthusiasts have been waiting for
      </Text>
    </Row>
    <Row>
      <td align="center">
        <table>
          <tr>
            <td style={{ paddingRight: 16 }}>
              <Button href="https://react.email">
                <Img
                  alt="Get it on Google Play button"
                  width={182.5}
                  height={54}
                  src="https://react.email/static/get-it-on-google-play.png"
                />
              </Button>
            </td>
            <td style={{ paddingLeft: 16 }}>
              <Button href="https://react.email">
                <Img
                  alt="Download on the App Store button"
                  width={164}
                  height={54}
                  src="https://react.email/static/download-on-the-app-store.png"
                />
              </Button>
            </td>
          </tr>
        </table>
      </td>
    </Row>
  </Column>
</Row>


Images:

import { Img } from "@react-email/components";

<Img
  alt="Ode Grinder"
  width={250}
  height={250}
  src="https://react.email/static/ode-grinder.jpg"
  style={{ marginLeft: 'auto', marginRight: 'auto' }}
/>


import { Img } from "@react-email/components";

<Img
  alt="Stagg Electric Kettle"
  width={250}
  height={250}
  src="https://react.email/static/stagg-eletric-kettle.jpg"
  style={{
    borderRadius: 12,
    marginTop: '0',
    marginBottom: '0',
    marginLeft: 'auto',
    marginRight: 'auto',
  }}
/>


import { Img } from "@react-email/components";

<>
  <Img
    alt="Atoms Vacuum Canister"
    height={150}
    src="https://react.email/static/atmos-vacuum-canister.jpg"
    style={{ borderRadius: 12, margin: '12px auto 12px' }}
  />
  <Img
    alt="Atoms Vacuum Canister"
    height={200}
    src="https://react.email/static/atmos-vacuum-canister.jpg"
    style={{ borderRadius: 12, margin: '12px auto 12px' }}
  />
  <Img
    alt="Atoms Vacuum Canister"
    height={250}
    src="https://react.email/static/atmos-vacuum-canister.jpg"
    style={{ borderRadius: 12, margin: '12px auto 12px' }}
  />
</>


Avatars:

import { Row, Column, Img } from "@react-email/components";

<Row
  width={undefined}
  style={{
    tableLayout: 'fixed',
    borderCollapse: 'collapse',
    borderSpacing: 0,
  }}
>
  <Column
    width="44"
    height="44"
    style={{
      height: '44px',
      width: '44px',
      padding: 0,
      textAlign: 'center',
      verticalAlign: 'middle',
      lineHeight: '0px',
    }}
  >
    <div
      style={{
        boxSizing: 'border-box',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        borderRadius: '9999px',
        border: '4px solid white',
        backgroundColor: '#030712',
      }}
    >
      <Img
        src="https://github.com/bukinoshita.png?size=100"
        alt="Bu Kinoshita"
        width="40"
        height="40"
        style={{
          display: 'inline-block',
          height: '100%',
          width: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />
    </div>
  </Column>
  <Column
    width="44"
    height="44"
    style={{
      position: 'relative',
      left: '-12px',
      height: '44px',
      width: '44px',
      padding: 0,
      textAlign: 'center',
      verticalAlign: 'middle',
      lineHeight: '0px',
    }}
  >
    <div
      style={{
        boxSizing: 'border-box',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        borderRadius: '9999px',
        border: '4px solid white',
        backgroundColor: '#030712',
      }}
    >
      <Img
        src="https://github.com/bukinoshita.png?size=100"
        alt="Bu Kinoshita"
        width="40"
        height="40"
        style={{
          display: 'inline-block',
          height: '100%',
          width: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />
    </div>
  </Column>
  <Column
    width="44"
    height="44"
    style={{
      position: 'relative',
      left: '-24px',
      height: '44px',
      width: '44px',
      padding: 0,
      textAlign: 'center',
      verticalAlign: 'middle',
      lineHeight: '0px',
    }}
  >
    <div
      style={{
        boxSizing: 'border-box',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        borderRadius: '9999px',
        border: '4px solid white',
        backgroundColor: '#030712',
      }}
    >
      <Img
        src="https://github.com/bukinoshita.png?size=100"
        alt="Bu Kinoshita"
        width="40"
        height="40"
        style={{
          display: 'inline-block',
          height: '100%',
          width: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />
    </div>
  </Column>
</Row>

import { Row, Column, Link, Img } from "@react-email/components";

<Row>
  <Column align="center">
    <Link href="https://github.com/zehfernandes">
      <Row
        style={{
          width: 'auto',
          tableLayout: 'fixed',
          borderCollapse: 'collapse',
          borderSpacing: 0,
        }}
      >
        <Column
          style={{
            height: '44px',
            width: '44px',
            overflow: 'hidden',
            borderRadius: '9999px',
            padding: 0,
            textAlign: 'center',
            verticalAlign: 'middle',
            lineHeight: '0px',
          }}
        >
          <Img
            src="https://github.com/zehfernandes.png?size=100"
            width="36"
            height="36"
            alt="Zeh Fernandes"
            style={{
              height: '100%',
              width: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        </Column>
        <Column
          style={{
            paddingLeft: '12px',
            fontSize: '14px',
            lineHeight: '20px',
            fontWeight: 500,
            color: '#6b7280',
          }}
        >
          <p style={{ margin: 0, color: '#374151' }}>Zeh Fernandes</p>
          <p style={{ margin: 0, fontSize: '12px', lineHeight: '14px' }}>
            Founding Designer
          </p>
        </Column>
      </Row>
    </Link>
  </Column>
</Row>

import { Row, Column, Img } from "@react-email/components";

<Row>
  <Column align="center">
    <Img
      src="https://github.com/luxonauta.png?size=100"
      alt="Lucas de França"
      width="30"
      height="30"
      style={{
        display: 'inline-block',
        width: '30px',
        height: '30px',
        borderRadius: '9999px',
      }}
    />
  </Column>
  <Column align="center">
    <Img
      src="https://github.com/luxonauta.png?size=100"
      alt="Lucas de França"
      width="42"
      height="42"
      style={{
        display: 'inline-block',
        width: '42px',
        height: '42px',
        borderRadius: '9999px',
      }}
    />
  </Column>
  <Column align="center">
    <Img
      src="https://github.com/luxonauta.png?size=100"
      alt="Lucas de França"
      width="54"
      height="54"
      style={{
        display: 'inline-block',
        width: '54px',
        height: '54px',
        borderRadius: '9999px',
      }}
    />
  </Column>
  <Column align="center">
    <Img
      src="https://github.com/luxonauta.png?size=100"
      alt="Lucas de França"
      width="66"
      height="66"
      style={{
        display: 'inline-block',
        width: '66px',
        height: '66px',
        borderRadius: '9999px',
      }}
    />
  </Column>
</Row>

import { Row, Column, Img } from "@react-email/components";

<Row>
  <Column align="center">
    <Img
      src="https://github.com/zenorocha.png?size=100"
      alt="Zeno Rocha"
      width="30"
      height="30"
      style={{
        display: 'inline-block',
        width: '30px',
        height: '30px',
        borderRadius: '6px',
      }}
    />
  </Column>
  <Column align="center">
    <Img
      src="https://github.com/zenorocha.png?size=100"
      alt="Zeno Rocha"
      width="42"
      height="42"
      style={{
        display: 'inline-block',
        width: '42px',
        height: '42px',
        borderRadius: '6px',
      }}
    />
  </Column>
  <Column align="center">
    <Img
      src="https://github.com/zenorocha.png?size=100"
      alt="Zeno Rocha"
      width="54"
      height="54"
      style={{
        display: 'inline-block',
        width: '54px',
        height: '54px',
        borderRadius: '6px',
      }}
    />
  </Column>
  <Column align="center">
    <Img
      src="https://github.com/zenorocha.png?size=100"
      alt="Zeno Rocha"
      width="66"
      height="66"
      style={{
        display: 'inline-block',
        width: '66px',
        height: '66px',
        borderRadius: '6px',
      }}
    />
  </Column>
</Row>

Gallery:

import { Section, Row, Text, Column, Link, Img } from "@react-email/components";

<Section style={{ marginTop: 16, marginBottom: 16 }}>
  <Section style={{ marginTop: 42 }}>
    <Row>
      <Text
        style={{
          margin: '0px',
          fontSize: 16,
          lineHeight: '24px',
          fontWeight: 600,
          color: 'rgb(79,70,229)',
        }}
      >
        Our products
      </Text>
      <Text
        style={{
          margin: '0px',
          marginTop: 8,
          fontSize: 24,
          lineHeight: '32px',
          fontWeight: 600,
          color: 'rgb(17,24,39)',
        }}
      >
        Elegant Style
      </Text>
      <Text
        style={{
          marginTop: 8,
          fontSize: 16,
          lineHeight: '24px',
          color: 'rgb(107,114,128)',
        }}
      >
        We spent two years in development to bring you the next generation of
        our award-winning home brew grinder. From the finest pour-overs to the
        coarsest cold brews, your coffee will never be the same again.
      </Text>
    </Row>
  </Section>
  <Section style={{ marginTop: 16 }}>
    <Row style={{ marginTop: 16 }}>
      <Column style={{ width: '50%', paddingRight: 8 }}>
        <Link href="#">
          <Img
            alt="Stagg Electric Kettle"
            height={288}
            src="https://react.email/static/stagg-eletric-kettle.jpg"
            style={{
              width: '100%',
              borderRadius: 12,
              objectFit: 'cover',
            }}
          />
        </Link>
      </Column>
      <Column style={{ width: '50%', paddingLeft: 8 }}>
        <Link href="#">
          <Img
            alt="Ode Grinder"
            height={288}
            src="https://react.email/static/ode-grinder.jpg"
            style={{
              width: '100%',
              borderRadius: 12,
              objectFit: 'cover',
            }}
          />
        </Link>
      </Column>
    </Row>
    <Row style={{ marginTop: 16 }}>
      <Column style={{ width: '50%', paddingRight: 8 }}>
        <Link href="#">
          <Img
            alt="Atmos Vacuum Canister"
            height={288}
            src="https://react.email/static/atmos-vacuum-canister.jpg"
            style={{
              width: '100%',
              borderRadius: 12,
              objectFit: 'cover',
            }}
          />
        </Link>
      </Column>
      <Column style={{ width: '50%', paddingLeft: 8 }}>
        <Link href="#">
          <Img
            alt="Clyde Electric Kettle"
            height={288}
            src="https://react.email/static/clyde-electric-kettle.jpg"
            style={{
              width: '100%',
              borderRadius: 12,
              objectFit: 'cover',
            }}
          />
        </Link>
      </Column>
    </Row>
  </Section>
</Section>

import { Section, Row, Text, Column, Link, Img } from "@react-email/components";

<Section style={{ marginTop: 16, marginBottom: 16 }}>
  <Section>
    <Row>
      <Text
        style={{
          margin: '0px',
          fontSize: 16,
          lineHeight: '24px',
          fontWeight: 600,
          color: 'rgb(79,70,229)',
        }}
      >
        Our products
      </Text>
      <Text
        style={{
          margin: '0px',
          marginTop: 8,
          fontSize: 24,
          lineHeight: '32px',
          fontWeight: 600,
          color: 'rgb(17,24,39)',
        }}
      >
        Elegant Style
      </Text>
      <Text
        style={{
          marginTop: 8,
          fontSize: 16,
          lineHeight: '24px',
          color: 'rgb(107,114,128)',
        }}
      >
        We spent two years in development to bring you the next generation of
        our award-winning home brew grinder. From the finest pour-overs to the
        coarsest cold brews, your coffee will never be the same again.
      </Text>
    </Row>
  </Section>
  <Section>
    <Row>
      <Column style={{ width: '33.333333%', paddingRight: 8 }}>
        <Link href="#">
          <Img
            alt="Stagg Electric Kettle"
            height={186}
            src="https://react.email/static/stagg-eletric-kettle.jpg"
            style={{
              width: '100%',
              borderRadius: 12,
              objectFit: 'cover',
            }}
          />
        </Link>
      </Column>
      <Column
        style={{ width: '33.333333%', paddingLeft: 8, paddingRight: 8 }}
      >
        <Link href="#">
          <Img
            alt="Ode Grinder"
            height={186}
            src="https://react.email/static/ode-grinder.jpg"
            style={{
              width: '100%',
              borderRadius: 12,
              objectFit: 'cover',
            }}
          />
        </Link>
      </Column>
      <Column style={{ width: '33.333333%', paddingLeft: 8 }}>
        <Link href="#">
          <Img
            alt="Clyde Electric Kettle"
            height={186}
            src="https://react.email/static/clyde-electric-kettle.jpg"
            style={{
              width: '100%',
              borderRadius: 12,
              objectFit: 'cover',
            }}
          />
        </Link>
      </Column>
    </Row>
  </Section>
</Section>

import { Section, Row, Text, Column, Link, Img } from "@react-email/components";

<Section style={{ marginTop: 16, marginBottom: 16 }}>
  <Section>
    <Row>
      <Text
        style={{
          margin: '0px',
          fontSize: 16,
          lineHeight: '24px',
          fontWeight: 600,
          color: 'rgb(79,70,229)',
        }}
      >
        Collections
      </Text>
      <Text
        style={{
          margin: '0px',
          marginTop: 8,
          fontSize: 24,
          lineHeight: '32px',
          fontWeight: 600,
          color: 'rgb(17,24,39)',
        }}
      >
        Bundle & Save
      </Text>
      <Text
        style={{
          marginTop: 8,
          fontSize: 16,
          lineHeight: '24px',
          color: 'rgb(107,114,128)',
        }}
      >
        Award-winning grinders and burrs for brewing like a barista at home.
      </Text>
    </Row>
  </Section>
  <Section style={{ marginTop: 16 }}>
    <Row style={{ marginTop: 16 }}>
      <Column style={{ width: '50%', paddingRight: 8 }}>
        <Row style={{ paddingBottom: 8 }}>
          <td>
            <Link href="#">
              <Img
                alt="Grinder Collection"
                height={152}
                src="https://react.email/static/grinder-collection.jpg"
                style={{
                  width: '100%',
                  borderRadius: 12,
                  objectFit: 'cover',
                }}
              />
            </Link>
          </td>
        </Row>
        <Row style={{ paddingTop: 8 }}>
          <td>
            <Link href="#">
              <Img
                alt="Bundle Collection"
                height={152}
                src="https://react.email/static/bundle-collection.jpg"
                style={{
                  width: '100%',
                  borderRadius: 12,
                  objectFit: 'cover',
                }}
              />
            </Link>
          </td>
        </Row>
      </Column>
      <Column
        style={{
          width: '50%',
          paddingLeft: 8,
          paddingTop: 8,
          paddingBottom: 8,
        }}
      >
        <Link href="#">
          <Img
            alt="Clara French Press"
            height={152 + 152 + 8 + 8}
            src="https://react.email/static/clara-french-press.jpg"
            style={{
              width: '100%',
              borderRadius: 12,
              objectFit: 'cover',
            }}
          />
        </Link>
      </Column>
    </Row>
  </Section>
</Section>

import { Section, Row, Text, Link, Img, Column } from "@react-email/components";

<Section style={{ marginTop: 16, marginBottom: 16 }}>
  <Section>
    <Row>
      <Text
        style={{
          margin: '0px',
          fontSize: 16,
          lineHeight: '24px',
          fontWeight: 600,
          color: 'rgb(79,70,229)',
        }}
      >
        Drinkware
      </Text>
      <Text
        style={{
          margin: '0px',
          marginTop: 8,
          fontSize: 24,
          lineHeight: '32px',
          fontWeight: 600,
          color: 'rgb(17,24,39)',
        }}
      >
        Ceramic Mugs
      </Text>
      <Text
        style={{
          marginTop: 8,
          fontSize: 16,
          lineHeight: '24px',
          color: 'rgb(107,114,128)',
        }}
      >
        Picasso your pour with a sleek ceramic cup designed for beautiful
        espresso drinks. Engineered for the outdoors and designed to enhance
        the taste of your libation of choice.
      </Text>
    </Row>
  </Section>
  <Section style={{ marginTop: 16 }}>
    <Link href="#">
      <Img
        alt="Mugs Collection"
        height={288}
        src="https://react.email/static/mugs-collection.jpg"
        style={{ borderRadius: 12, objectFit: 'cover' }}
        width="100%"
      />
    </Link>
    <Row style={{ marginTop: 16 }}>
      <Column style={{ width: '50%', paddingRight: 8 }}>
        <Link href="#">
          <Img
            alt="Monty Art Cup - 1"
            height={288}
            src="https://react.email/static/monty-art-cup-1.jpg"
            style={{ borderRadius: 12, objectFit: 'cover' }}
            width="100%"
          />
        </Link>
      </Column>
      <Column style={{ width: '50%', paddingLeft: 8 }}>
        <Link href="#">
          <Img
            alt="Monty Art Cup - 2"
            height={288}
            src="https://react.email/static/monty-art-cup-2.jpg"
            style={{
              borderRadius: 12,
              objectFit: 'cover',
            }}
            width="100%"
          />
        </Link>
      </Column>
    </Row>
  </Section>
</Section>


Lists:

import { Html, Head, Body, Preview, Container, Heading, Section, Row, Column, Text } from "@react-email/components";

<Html>
  <Head />
  <Body>
    <Preview>Top 5 Features of Our Service</Preview>
    <Container
      style={{
        backgroundColor: 'rgb(255,255,255)',
        borderRadius: '8px',
        marginLeft: 'auto',
        marginRight: 'auto',
        maxWidth: '600px',
        padding: '24px',
      }}
    >
      <Heading
        style={{
          fontSize: '24px',
          lineHeight: '32px',
          marginBottom: '42px',
          textAlign: 'center',
        }}
      >
        Top 5 Features of Our Service
      </Heading>
      {[
        {
          number: 1,
          title: 'Innovative Solutions',
          description:
            'We deliver innovative solutions that drive success and growth.',
        },
        {
          number: 2,
          title: 'Exceptional Performance',
          description:
            'Our services deliver high-quality performance and efficiency.',
        },
        {
          number: 3,
          title: 'Reliable Support',
          description:
            'We have robust support to keep your operations running smoothly.',
        },
        {
          number: 4,
          title: 'Advanced Security',
          description:
            'We implement cutting-edge security measures to protect your data and assets.',
        },
        {
          number: 5,
          title: 'Scalable Growth',
          description:
            'We develop customized strategies for sustainable and scalable growth.',
        },
      ].map((feature) => (
        <Section
          style={{
            marginBottom: '36px',
          }}
        >
          <Row
            style={{
              paddingLeft: '12px',
              paddingRight: '32px',
            }}
          >
            <Column
              width="24"
              height="24"
              valign="top"
              align="center"
              style={{
                width: '24px',
                height: '24px',
                paddingRight: '18px',
              }}
            >
              <Row>
                <Column
                  width="24"
                  height="24"
                  align="center"
                  valign="middle"
                  style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: 'rgb(79,70,229)',
                    borderRadius: '9999px',
                    color: 'rgb(255,255,255)',
                    fontSize: '12px',
                    fontWeight: '600',
                    lineHeight: '1',
                  }}
                >
                  {feature.number}
                </Column>
              </Row>
            </Column>
            <Column>
              <Heading
                as="h2"
                style={{
                  color: 'rgb(17,24,39)',
                  fontSize: '18px',
                  lineHeight: '28px',
                  marginBottom: '8px',
                  marginTop: '0px',
                }}
              >
                {feature.title}
              </Heading>
              <Text
                style={{
                  color: 'rgb(107,114,128)',
                  fontSize: '14px',
                  lineHeight: '24px',
                  margin: '0px',
                }}
              >
                {feature.description}
              </Text>
            </Column>
          </Row>
        </Section>
      ))}
    </Container>
  </Body>
</Html>


import { Html, Head, Body, Preview, Container, Heading, Section, Row, Column, Img, Text, Link } from "@react-email/components";

<Html>
  <Head />
  <Body
    style={{
      backgroundColor: 'rgb(255,255,255)',
    }}
  >
    <Preview>How Our Service Works: 5 Simple Steps</Preview>
    <Container
      style={{
        backgroundColor: 'rgb(255,255,255)',
        borderRadius: '8px',
        marginLeft: 'auto',
        marginRight: 'auto',
        maxWidth: '600px',
        paddingLeft: '24px',
        paddingRight: '24px',
        paddingTop: '24px',
        paddingBottom: '0px',
      }}
    >
      <Heading
        as="h1"
        style={{
          fontSize: '24px',
          lineHeight: '32px',
          marginBottom: '42px',
          textAlign: 'center',
        }}
      >
        How Our Service Works: 5 Simple Steps
      </Heading>
      {[
        {
          number: 1,
          imageUrl: '/static/stagg-eletric-kettle.jpg',
          title: 'Start Your Search',
          description:
            'Search for the products you need or upload your list of requirements.',
          learnMoreLink: '#',
        },
        {
          number: 2,
          imageUrl: '/static/atmos-vacuum-canister.jpg',
          title: 'Compare & Save',
          description:
            'Compare prices and offers from different suppliers to find the best deals.',
          learnMoreLink: '#',
        },
        {
          number: 3,
          imageUrl: '/static/bundle-collection.jpg',
          title: 'Build Your Cart',
          description:
            'Select your desired items and add them to your shopping cart.',
          learnMoreLink: '#',
        },
        {
          number: 4,
          imageUrl: '/static/clara-french-press.jpg',
          title: 'Enjoy The Benefits',
          description:
            'Receive your products and enjoy the savings and convenience of our service.',
          learnMoreLink: '#',
        },
      ].map((step) => (
        <Section
          style={{
            marginBottom: '30px',
          }}
        >
          <Row style={{ marginBottom: '24px' }}>
            <Column
              width="40%"
              style={{ width: '40%', paddingRight: '24px' }}
            >
              <Img
                src={step.imageUrl}
                width="100%"
                height="168"
                alt={`Step image - ${step.number}`}
                style={{
                  borderRadius: '4px',
                  display: 'block',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  width: '100%',
                }}
              />
            </Column>
            <Column
              width="60%"
              style={{ width: '60%', paddingRight: '24px' }}
            >
              <Row
                width="24"
                style={{
                  width: 24,
                  height: 24,
                  marginBottom: 18,
                }}
                align={undefined}
              >
                <Column
                  width="24"
                  height="24"
                  style={{
                    borderRadius: '9999px',
                    height: 24,
                    width: 24,
                    backgroundColor: 'rgb(79,70,229)',
                    color: 'rgb(255,255,255)',
                    fontWeight: 600,
                    fontSize: 12,
                    lineHeight: 1,
                  }}
                  align="center"
                  valign="middle"
                >
                  {step.number}
                </Column>
              </Row>
              <Heading
                as="h2"
                style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  lineHeight: '1',
                  marginBottom: '8px',
                  marginTop: '0px',
                }}
              >
                {step.title}
              </Heading>
              <Text
                style={{
                  color: 'rgb(107,114,128)',
                  fontSize: '14px',
                  lineHeight: '24px',
                  margin: '0px',
                }}
              >
                {step.description}
              </Text>
              <Link
                href={step.learnMoreLink}
                style={{
                  color: 'rgb(79,70,229)',
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginTop: '12px',
                  textDecorationLine: 'none',
                }}
              >
                Learn more →
              </Link>
            </Column>
          </Row>
        </Section>
      ))}
    </Container>
  </Body>
</Html>

Articles:

import { Section, Img, Text, Heading, Button } from "@react-email/components";

<Section style={{ marginTop: 16, marginBottom: 16 }}>
  <Img
    alt="Herman Miller Chair"
    height="320"
    src="https://react.email/static/herman-miller-chair.jpg"
    style={{
      width: '100%',
      borderRadius: 12,
      objectFit: 'cover',
    }}
  />
  <Section
    style={{
      marginTop: 32,
      textAlign: 'center',
    }}
  >
    <Text
      style={{
        marginTop: 16,
        marginBottom: 16,
        fontSize: 18,
        lineHeight: '28px',
        fontWeight: 600,
        color: 'rgb(79,70,229)',
      }}
    >
      Our new article
    </Text>
    <Heading
      as="h1"
      style={{
        margin: '0px',
        marginTop: 8,
        fontSize: 36,
        lineHeight: '36px',
        fontWeight: 600,
        color: 'rgb(17,24,39)',
      }}
    >
      Designing with Furniture
    </Heading>
    <Text
      style={{ fontSize: 16, lineHeight: '24px', color: 'rgb(107,114,128)' }}
    >
      Unleash your inner designer as we explore how furniture plays a vital
      role in creating stunning interiors, offering insights into choosing the
      right pieces, arranging them harmoniously, and infusing your space with
      personality.
    </Text>
    <Button
      href="https://react.email"
      style={{
        marginTop: 16,
        borderRadius: 8,
        backgroundColor: 'rgb(79,70,229)',
        paddingLeft: 40,
        paddingRight: 40,
        paddingTop: 12,
        paddingBottom: 12,
        fontWeight: 600,
        color: 'rgb(255,255,255)',
      }}
    >
      Read more
    </Button>
  </Section>
</Section>


import { Section, Text, Link, Img } from "@react-email/components";

<Section
  style={{ marginTop: '16px', textAlign: 'center', marginBottom: '16px' }}
>
  <Section
    style={{
      display: 'inline-block',
      textAlign: 'left',
      width: '100%',
      maxWidth: 250,
      verticalAlign: 'top',
    }}
  >
    <Text
      style={{
        margin: '0px',
        fontSize: 16,
        lineHeight: '24px',
        fontWeight: 600,
        color: 'rgb(79,70,229)',
      }}
    >
      What's new
    </Text>
    <Text
      style={{
        margin: '0px',
        marginTop: '8px',
        fontSize: 20,
        lineHeight: '28px',
        fontWeight: 600,
        color: 'rgb(17,24,39)',
      }}
    >
      Versatile Comfort
    </Text>
    <Text
      style={{
        marginTop: 8,
        fontSize: 16,
        lineHeight: '24px',
        color: 'rgb(107,114,128)',
      }}
    >
      Experience ultimate comfort and versatility with our furniture
      collection, designed to adapt to your ever-changing needs.
    </Text>
    <Link
      href="https://react.email"
      style={{ color: 'rgb(79,70,229)', textDecorationLine: 'underline' }}
    >
      Read more
    </Link>
  </Section>
  <Section
    style={{
      display: 'inline-block',
      marginTop: 8,
      marginBottom: 8,
      width: '100%',
      maxWidth: 220,
      verticalAlign: 'top',
    }}
  >
    <Img
      alt="An aesthetic picture taken of an Iphone, flowers, glasses and a card that reads 'Gucci, bloom' coming out of a leathered bag with a ziper"
      height={220}
      src="https://react.email/static/versatile-comfort.jpg"
      style={{
        borderRadius: 8,
        objectFit: 'cover',
      }}
      width={220}
    />
  </Section>
</Section>


import { Text, Heading, Button } from "@react-email/components";

<table
  align="center"
  border={0}
  cellPadding="0"
  cellSpacing="0"
  role="presentation"
  style={{
    height: 424,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgb(37,99,235)',
    // This url must be in quotes for Yahoo
    backgroundImage: "url('/static/my-image.png')",
    backgroundSize: '100% 100%',
  }}
  width="100%"
>
  <tbody>
    <tr>
      <td align="center" style={{ padding: 40, textAlign: 'center' }}>
        <Text
          style={{
            margin: '0px',
            fontWeight: 600,
            color: 'rgb(229,231,235)',
          }}
        >
          New article
        </Text>
        <Heading
          as="h1"
          style={{
            margin: '0px',
            marginTop: 4,
            fontWeight: 700,
            color: 'rgb(255,255,255)',
          }}
        >
          Artful Accents
        </Heading>
        <Text
          style={{
            margin: '0px',
            marginTop: 8,
            fontSize: 16,
            lineHeight: '24px',
            color: 'rgb(255,255,255)',
          }}
        >
          Uncover the power of accent furniture in transforming your space
          with subtle touches of style, personality, and functionality, as we
          explore the art of curating captivating accents.
        </Text>
        <Button
          href="https://react.email"
          style={{
            marginTop: 24,
            borderRadius: 8,
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: 'rgb(229,231,235)',
            backgroundColor: 'rgb(255,255,255)',
            paddingLeft: 40,
            paddingRight: 40,
            paddingTop: 12,
            paddingBottom: 12,
            fontWeight: 600,
            color: 'rgb(17,24,39)',
          }}
        >
          Read more
        </Button>
      </td>
    </tr>
  </tbody>
</table>


import { Section, Row, Text, Column, Img } from "@react-email/components";

<Section
  style={{
    marginTop: 16,
    marginBottom: 16,
  }}
>
  <Row>
    <Text
      style={{
        margin: '0px',
        fontSize: 20,
        lineHeight: '28px',
        fontWeight: 600,
        color: 'rgb(17,24,39)',
      }}
    >
      Elevate Outdoor Living
    </Text>
    <Text
      style={{
        marginTop: 8,
        fontSize: 16,
        lineHeight: '24px',
        color: 'rgb(107,114,128)',
      }}
    >
      Take your outdoor space to new heights with our premium outdoor
      furniture, designed to elevate your alfresco experience.
    </Text>
  </Row>
  <Row
    style={{
      marginTop: 16,
    }}
  >
    <Column
      colSpan={1}
      style={{
        width: '50%',
        verticalAlign: 'baseline',
        paddingRight: 8,
        boxSizing: 'border-box',
      }}
    >
      <Img
        alt="A picture of a pink background with varios items laid out. Shoes, lipstick, sunglasses, some leafs and part of a purse."
        height="180"
        src="https://react.email/static/outdoor-living.jpg"
        style={{
          width: '100%',
          borderRadius: 8,
          objectFit: 'cover',
        }}
      />
      <Text
        style={{
          fontSize: 16,
          lineHeight: '24px',
          fontWeight: 600,
          color: 'rgb(79,70,229)',
        }}
      >
        What's new
      </Text>
      <Text
        style={{
          margin: '0px',
          fontSize: 20,
          lineHeight: '28px',
          fontWeight: 600,
          color: 'rgb(17,24,39)',
        }}
      >
        Multifunctional Marvels
      </Text>
      <Text
        style={{
          marginBottom: '0px',
          marginTop: 8,
          fontSize: 16,
          lineHeight: '24px',
          color: 'rgb(107,114,128)',
        }}
      >
        Discover the innovative world of multifunctional furniture, where
        style meets practicality, offering creative solutions for maximizing
        space and enhancing functionality in your home
      </Text>
    </Column>
    <Column
      colSpan={1}
      style={{
        width: '50%',
        verticalAlign: 'baseline',
        paddingLeft: 8,
        boxSizing: 'border-box',
      }}
    >
      <Img
        alt="A picture of a pink background with varios items laid out. Shoes, lipstick, sunglasses, some leafs and part of a purse."
        height="180"
        src="https://react.email/static/outdoor-living.jpg"
        style={{
          width: '100%',
          borderRadius: 8,
          objectFit: 'cover',
        }}
      />
      <Text
        style={{
          fontSize: 16,
          lineHeight: '24px',
          fontWeight: 600,
          color: 'rgb(79,70,229)',
        }}
      >
        What's new
      </Text>
      <Text
        style={{
          margin: '0px',
          fontSize: 20,
          lineHeight: '28px',
          fontWeight: 600,
          color: 'rgb(17,24,39)',
        }}
      >
        Timeless Classics
      </Text>
      <Text
        style={{
          marginBottom: '0px',
          marginTop: 8,
          fontSize: 16,
          lineHeight: '24px',
          color: 'rgb(107,114,128)',
        }}
      >
        Step into the world of timeless classics as we explore iconic
        furniture pieces that have stood the test of time, adding enduring
        elegance and sophistication to any interior
      </Text>
    </Column>
  </Row>
</Section>


import { Section, Hr, Row, Column, Img, Heading, Text, Link } from "@react-email/components";

<Section>
  <Hr
    style={{
      borderColor: 'rgb(209,213,219) !important',
      marginTop: '16px',
      marginBottom: '16px',
    }}
  />
  <Row width={undefined}>
    <Column
      width="48"
      height="48"
      style={{
        display: 'inline-block',
        paddingTop: '5px',
        height: '48px',
        width: '48px',
      }}
    >
      <Img
        alt="Steve Jobs"
        height={48}
        src="https://react.email/static/steve-jobs.jpg"
        style={{
          borderRadius: '9999px',
          display: 'block',
          height: '48px',
          objectFit: 'cover',
          objectPosition: 'center',
          width: '48px',
        }}
        width={48}
      />
    </Column>
    <Column
      width="120"
      style={{
        paddingLeft: '18px',
        maxWidth: '120px',
      }}
      align="left"
      valign="top"
    >
      <Heading
        as="h3"
        style={{
          color: 'rgb(31,41,55)',
          fontSize: '14px',
          fontWeight: 500,
          lineHeight: '20px',
          margin: '0px',
        }}
      >
        Steve Jobs
      </Heading>
      <Text
        style={{
          color: 'rgb(107,114,128)',
          fontSize: '12px',
          fontWeight: 500,
          lineHeight: '14px',
          margin: '0px',
        }}
      >
        Co-Founder & CEO
      </Text>
      <Row
        align={undefined}
        width={undefined}
        style={{
          marginTop: '4px',
        }}
      >
        <Column width={undefined} valign="middle">
          <Link
            href="#"
            style={{
              height: '12px',
              width: '12px',
            }}
          >
            <Img
              alt="X"
              src="https://react.email/static/x-icon.png"
              width="12"
              height="12"
              style={{ height: '12px', width: '12px' }}
            />
          </Link>
        </Column>
        <Column
          width={undefined}
          valign="middle"
          style={{
            paddingLeft: '8px',
          }}
        >
          <Link
            href="#"
            style={{
              height: '12px',
              width: '12px',
            }}
          >
            <Img
              alt="LinkedIn"
              src="https://react.email/static/in-icon.png"
              width="12"
              height="12"
              style={{ height: '12px', width: '12px' }}
            />
          </Link>
        </Column>
      </Row>
    </Column>
  </Row>
</Section>


import { Section, Hr, Row, Column, Img, Heading, Text, Link } from "@react-email/components";

<Section>
  <Hr
    style={{
      borderColor: 'rgb(209,213,219) !important',
      marginTop: '16px',
      marginBottom: '0px',
    }}
  />
  <Section>
    {[
      {
        name: 'Steve Jobs',
        title: 'Co-Founder & CEO',
        imgSrc: '/static/steve-jobs.jpg',
        showDivider: true,
      },
      {
        name: 'Steve Wozniak',
        title: 'Co-Founder & CTO',
        imgSrc: '/static/steve-wozniak.jpg',
        showDivider: false,
      },
    ].map((author) => (
      <Fragment key={author.name}>
        <Row
          align="left"
          width="288"
          style={{ marginTop: '16px', width: '288px' }}
        >
          <Column
            width="48"
            height="48"
            style={{
              paddingTop: '5px',
              height: '48px',
              width: '48px',
              textAlign: 'left',
            }}
          >
            <Img
              alt={author.name}
              height={48}
              src={author.imgSrc}
              style={{
                borderRadius: '9999px',
                display: 'block',
                objectFit: 'cover',
                objectPosition: 'center',
              }}
              width={48}
            />
          </Column>
          <Column
            width="100%"
            style={{
              paddingLeft: '18px',
              width: '100%',
              textAlign: 'left',
              verticalAlign: 'top',
            }}
          >
            <Heading
              as="h3"
              style={{
                color: 'rgb(17,24,39)',
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: '20px',
                margin: '0px',
              }}
            >
              {author.name}
            </Heading>
            <Text
              style={{
                color: 'rgb(107,114,128)',
                fontSize: '12px',
                fontWeight: 500,
                lineHeight: '14px',
                margin: '0px',
              }}
            >
              {author.title}
            </Text>
            <Row width={undefined} style={{ paddingTop: '8px' }} align="left">
              <Column width="12" height="12">
                <Link
                  href="#"
                  style={{
                    height: '12px',
                    width: '12px',
                  }}
                >
                  <Img
                    alt="X"
                    height={12}
                    src="https://react.email/static/x-icon.png"
                    width={12}
                  />
                </Link>
              </Column>
              <Column width="12" height="12" style={{ paddingLeft: 8 }}>
                <Link
                  href="#"
                  style={{
                    height: '12px',
                    width: '12px',
                  }}
                >
                  <Img
                    alt="LinkedIn"
                    height={12}
                    src="https://react.email/static/in-icon.png"
                    width={12}
                  />
                </Link>
              </Column>
            </Row>
          </Column>
        </Row>
        {author.showDivider ? (
          <Hr
            style={{
              border: 'none',
              backgroundColor: 'rgb(209,213,219)',
              display: 'inline-block',
              float: 'left',
              height: '58px',
              marginRight: '16px',
              width: '1px',
            }}
          />
        ) : null}
      </Fragment>
    ))}
  </Section>
</Section>


Features:

import { Section, Row, Text, Hr, Column, Img } from "@react-email/components";

<Section style={{ marginTop: 16, marginBottom: 16 }}>
  <Section>
    <Row>
      <Text
        style={{
          margin: '0px',
          fontSize: 24,
          lineHeight: '32px',
          fontWeight: 600,
          color: 'rgb(17,24,39)',
        }}
      >
        Functional Style
      </Text>
      <Text
        style={{
          marginTop: 8,
          fontSize: 16,
          lineHeight: '24px',
          color: 'rgb(107,114,128)',
        }}
      >
        Combine practicality and style effortlessly with our furniture,
        offering functional designs that enhance your living space.
      </Text>
    </Row>
  </Section>
  <Section>
    <Hr
      style={{
        marginLeft: '0px',
        marginRight: '0px',
        marginTop: 32,
        marginBottom: 32,
        width: '100%',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'rgb(209,213,219) !important',
      }}
    />
    <Section>
      <Row>
        <Column style={{ verticalAlign: 'baseline' }}>
          <Img
            alt="heart icon"
            height="48"
            src="https://react.email/static/heart-icon.png"
            width="48"
          />
        </Column>
        <Column style={{ width: '85%' }}>
          <Text
            style={{
              margin: '0px',
              fontSize: 20,
              fontWeight: 600,
              lineHeight: '28px',
              color: 'rgb(17,24,39)',
            }}
          >
            Versatile Comfort
          </Text>
          <Text
            style={{
              margin: '0px',
              marginTop: 8,
              fontSize: 16,
              lineHeight: '24px',
              color: 'rgb(107,114,128)',
            }}
          >
            Experience ultimate comfort and versatility with our furniture
            collection, designed to adapt to your ever-changing needs.
          </Text>
        </Column>
      </Row>
    </Section>
    <Hr
      style={{
        marginLeft: '0px',
        marginRight: '0px',
        marginTop: 32,
        marginBottom: 32,
        width: '100%',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'rgb(209,213,219) !important',
      }}
    />
    <Section>
      <Row>
        <Column style={{ verticalAlign: 'baseline' }}>
          <Img
            alt="rocket icon"
            height="48"
            src="https://react.email/static/rocket-icon.png"
            width="48"
          />
        </Column>
        <Column style={{ width: '85%' }}>
          <Text
            style={{
              margin: '0px',
              fontSize: 20,
              fontWeight: 600,
              lineHeight: '28px',
              color: 'rgb(17,24,39)',
            }}
          >
            Luxurious Retreat
          </Text>
          <Text
            style={{
              margin: '0px',
              marginTop: 8,
              fontSize: 16,
              lineHeight: '24px',
              color: 'rgb(107,114,128)',
            }}
          >
            Transform your space into a haven of relaxation with our indulgent
            furniture collection.
          </Text>
        </Column>
      </Row>
    </Section>
    <Hr
      style={{
        marginLeft: '0px',
        marginRight: '0px',
        marginTop: 32,
        marginBottom: 32,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'rgb(209,213,219) !important',
      }}
    />
  </Section>
</Section>

import { Section, Row, Text, Hr, Column } from "@react-email/components";

<Section style={{ marginTop: 16 }}>
  <Section style={{ paddingBottom: 24 }}>
    <Row>
      <Text
        style={{
          margin: 0,
          fontWeight: 600,
          fontSize: 24,
          color: 'rgb(17,24,39)',
          lineHeight: '32px',
        }}
      >
        Functional Style
      </Text>
      <Text
        style={{
          marginTop: 8,
          fontSize: 16,
          color: 'rgb(107,114,128)',
          lineHeight: '24px',
        }}
      >
        Combine practicality and style effortlessly with our furniture,
        offering functional designs that enhance your living space.
      </Text>
    </Row>
  </Section>
  {[
    {
      title: 'Vesatile Comfort',
      description:
        'Experience ultimate comfort and versatility with our furniture collection, designed to adapt to your ever-changing needs.',
    },
    {
      title: 'Luxurious Retreat',
      description:
        'Transform your space into a haven of relaxation with our indulgent furniture collection.',
    },
    {
      title: 'Unleash Creativity',
      description:
        'Unleash your inner designer with our customizable furniture options, allowing you to create a space that reflects your unique vision',
    },
    {
      title: 'Elevate Outdoor Living',
      description:
        'Take your outdoor space to new heights with our premium outdoor furniture, designed to elevate your alfresco experience.',
    },
  ].map((feature, index) => (
    <Fragment key={feature.title}>
      <Hr
        style={{
          border: '1px solid rgb(209, 213, 219)',
          margin: 0,
          width: '100%',
        }}
      />
      <Section
        style={{
          paddingTop: 24,
          paddingBottom: 24,
        }}
      >
        <Row>
          <Column
            width="48"
            height="40"
            style={{
              width: 40,
              height: 40,
              paddingRight: 8,
            }}
            valign="baseline"
          >
            <Row width="40" align="left">
              <Column
                align="center"
                height="40"
                style={{
                  backgroundColor: 'rgb(199, 210, 254)',
                  borderRadius: '9999px',
                  color: 'rgb(79, 70, 229)',
                  fontWeight: 600,
                  height: 40,
                  padding: 0,
                  width: 40,
                }}
                valign="middle"
                width="40"
              >
                {index + 1}
              </Column>
            </Row>
          </Column>
          <Column width="100%" style={{ width: '100%' }}>
            <Text
              style={{
                margin: 0,
                fontWeight: 600,
                fontSize: 20,
                lineHeight: '28px',
                color: 'rgb(17, 24, 39)',
              }}
            >
              {feature.title}
            </Text>
            <Text
              style={{
                margin: 0,
                fontWeight: 600,
                paddingTop: 8,
                fontSize: 16,
                lineHeight: '24px',
                color: 'rgb(107, 114, 128)',
              }}
            >
              {feature.description}
            </Text>
          </Column>
        </Row>
      </Section>
    </Fragment>
  ))}
</Section>


import { Section, Row, Text, Column, Img } from "@react-email/components";

<Section style={{ marginTop: 16, marginBottom: 16 }}>
  <Row>
    <Text
      style={{
        margin: '0px',
        fontSize: 24,
        lineHeight: '32px',
        fontWeight: 600,
        color: 'rgb(17,24,39)',
      }}
    >
      Unleash Timeless Comfort in Your Home
    </Text>
    <Text
      style={{
        marginTop: 8,
        fontSize: 16,
        lineHeight: '24px',
        color: 'rgb(107,114,128)',
      }}
    >
      Elevate your space with impeccable quality, and versatile styles.
    </Text>
  </Row>
  <Row style={{ marginTop: 16 }}>
    <Column
      colSpan={1}
      style={{
        width: '50%',
        paddingRight: 12,
        verticalAlign: 'baseline',
      }}
    >
      <Img
        alt="heart icon"
        height="48"
        src="https://react.email/static/heart-icon.png"
        width="48"
      />
      <Text
        style={{
          margin: '0px',
          marginTop: 16,
          fontSize: 20,
          lineHeight: '28px',
          fontWeight: 600,
          color: 'rgb(17,24,39)',
        }}
      >
        Multifunctional Marvels
      </Text>
      <Text
        style={{
          marginBottom: '0px',
          marginTop: 8,
          fontSize: 16,
          lineHeight: '24px',
          color: 'rgb(107,114,128)',
        }}
      >
        Discover comfort and style with our exquisite furniture collection at
        Acme. Transform your living space into a haven of timeless comfort
        with our range of plush sofas, elegant dining sets, cozy armchairs,
        and functional storage solutions.
      </Text>
    </Column>
    <Column
      colSpan={1}
      style={{ paddingLeft: 12, verticalAlign: 'baseline', width: '50%' }}
    >
      <Img
        alt="rocket icon"
        height="48"
        src="https://react.email/static/rocket-icon.png"
        width="48"
      />
      <Text
        style={{
          margin: '0px',
          marginTop: 16,
          fontSize: 20,
          lineHeight: '28px',
          fontWeight: 600,
          color: 'rgb(17,24,39)',
        }}
      >
        Impeccable Quality
      </Text>
      <Text
        style={{
          marginBottom: '0px',
          marginTop: 8,
          fontSize: 16,
          lineHeight: '24px',
          color: 'rgb(107,114,128)',
        }}
      >
        Quality is our priority. Our furniture is meticulously crafted by
        skilled artisans, ensuring durability and elegance. From solid wood
        frames to carefully selected upholstery fabrics, each piece is
        thoughtfully designed to deliver unmatched quality.
      </Text>
    </Column>
  </Row>
  <Row style={{ marginTop: 32 }}>
    <Column
      colSpan={1}
      style={{
        width: '50%',
        paddingRight: 12,
        verticalAlign: 'baseline',
      }}
    >
      <Img
        alt="megaphone icon"
        height="48"
        src="https://react.email/static/megaphone-icon.png"
        width="48"
      />
      <Text
        style={{
          margin: '0px',
          marginTop: 16,
          fontSize: 20,
          lineHeight: '28px',
          fontWeight: 600,
          color: 'rgb(17,24,39)',
        }}
      >
        Versatile Styles
      </Text>
      <Text
        style={{
          marginBottom: '0px',
          marginTop: 8,
          fontSize: 16,
          lineHeight: '24px',
          color: 'rgb(107,114,128)',
        }}
      >
        Express your unique style with our diverse range of furniture options.
        Whether you prefer contemporary minimalism, rustic charm, or timeless
        elegance, our selection offers something to complement every taste.
        Choose from sleek modern lines to ornate detailing.
      </Text>
    </Column>
    <Column
      colSpan={1}
      style={{ width: '50%', paddingLeft: 12, verticalAlign: 'baseline' }}
    >
      <Img
        alt="cube icon"
        height="48"
        src="https://react.email/static/cube-icon.png"
        width="48"
      />
      <Text
        style={{
          margin: '0px',
          marginTop: 16,
          fontSize: 20,
          lineHeight: '28px',
          fontWeight: 600,
          color: 'rgb(17,24,39)',
        }}
      >
        Personalized Service
      </Text>
      <Text
        style={{
          marginBottom: '0px',
          marginTop: 8,
          fontSize: 16,
          lineHeight: '24px',
          color: 'rgb(107,114,128)',
        }}
      >
        Experience personalised service at Acme. Our friendly team is
        dedicated to assisting you in finding the perfect furniture pieces.
        From fabric selection to space planning, we're here to ensure your
        complete satisfaction. Indulge in the luxury of personalised furniture
        shopping.
      </Text>
    </Column>
  </Row>
</Section>


import { Section, Row, Text, Img } from "@react-email/components";

<Section style={{ marginTop: 16, marginBottom: 16 }}>
  <Row>
    <Text
      style={{
        margin: '0px',
        fontSize: 24,
        lineHeight: '32px',
        fontWeight: 600,
        color: 'rgb(17,24,39)',
      }}
    >
      Modern Comfort
    </Text>
    <Text
      style={{
        marginTop: 8,
        fontSize: 16,
        lineHeight: '24px',
        color: 'rgb(107,114,128)',
      }}
    >
      Experience contemporary bliss with our sleek and cozy furniture
      collection, designed for optimal comfort and style
    </Text>
  </Row>
  <table width="100%">
    <tr style={{ width: '100%', marginTop: 16 }}>
      <td
        align="center"
        style={{
          width: '50%',
          paddingRight: 12,
          verticalAlign: 'baseline',
        }}
      >
        <Img
          alt="heart icon"
          height="48"
          src="https://react.email/static/heart-icon.png"
          width="48"
        />
        <Text
          style={{
            margin: '0px',
            marginTop: 16,
            fontSize: 20,
            lineHeight: '28px',
            fontWeight: 600,
            color: 'rgb(17,24,39)',
          }}
        >
          Timeless Beauty
        </Text>
        <Text
          style={{
            marginBottom: '0px',
            marginTop: 8,
            fontSize: 16,
            lineHeight: '24px',
            color: 'rgb(107,114,128)',
          }}
        >
          Indulge in the enduring beauty of our furniture pieces, crafted with
          exquisite attention to detail and timeless design
        </Text>
      </td>
      <td
        align="center"
        style={{
          width: '50%',
          paddingRight: 12,
          verticalAlign: 'baseline',
        }}
      >
        <Img
          alt="rocket icon"
          height="48"
          src="https://react.email/static/rocket-icon.png"
          width="48"
        />
        <Text
          style={{
            margin: '0px',
            marginTop: 16,
            fontSize: 20,
            lineHeight: '28px',
            fontWeight: 600,
            color: 'rgb(17,24,39)',
          }}
        >
          Effortless Function
        </Text>
        <Text
          style={{
            marginBottom: '0px',
            marginTop: 8,
            fontSize: 16,
            lineHeight: '24px',
            color: 'rgb(107,114,128)',
          }}
        >
          Discover furniture that seamlessly combines form and function,
          making everyday living a breeze with its practicality
        </Text>
      </td>
    </tr>
    <tr style={{ width: '100%', marginTop: 16 }}>
      <td
        align="center"
        style={{
          width: '50%',
          paddingRight: 12,
          verticalAlign: 'baseline',
        }}
      >
        <Img
          alt="megaphone icon"
          height="48"
          src="https://react.email/static/megaphone-icon.png"
          width="48"
        />
        <Text
          style={{
            margin: '0px',
            marginTop: 16,
            fontSize: 20,
            lineHeight: '28px',
            fontWeight: 600,
            color: 'rgb(17,24,39)',
          }}
        >
          Customize Your Space
        </Text>
        <Text
          style={{
            marginBottom: '0px',
            marginTop: 8,
            fontSize: 16,
            lineHeight: '24px',
            color: 'rgb(107,114,128)',
          }}
        >
          Personalize your living environment with our customizable furniture
          options, allowing you to tailor your space to perfection
        </Text>
      </td>
      <td
        align="center"
        style={{
          width: '50%',
          paddingRight: 12,
          verticalAlign: 'baseline',
        }}
      >
        <Img
          alt="cube icon"
          height="48"
          src="https://react.email/static/cube-icon.png"
          width="48"
        />
        <Text
          style={{
            margin: '0px',
            marginTop: 16,
            fontSize: 20,
            lineHeight: '28px',
            fontWeight: 600,
            color: 'rgb(17,24,39)',
          }}
        >
          Outdoor Serenity
        </Text>
        <Text
          style={{
            marginBottom: '0px',
            marginTop: 8,
            fontSize: 16,
            lineHeight: '24px',
            color: 'rgb(107,114,128)',
          }}
        >
          Create a tranquil outdoor retreat with our premium outdoor
          furniture, offering both durability and serene relaxation
        </Text>
      </td>
    </tr>
  </table>
</Section>


import { Section, Row, Text, Column, Img } from "@react-email/components";

<Section
  style={{
    marginTop: 16,
    marginBottom: 16,
  }}
>
  <Row>
    <Text
      style={{
        margin: '0px',
        fontSize: 24,
        lineHeight: '32px',
        fontWeight: 600,
        color: 'rgb(17,24,39)',
      }}
    >
      Modern Comfort
    </Text>
    <Text
      style={{
        marginTop: 8,
        fontSize: 16,
        lineHeight: '24px',
        color: 'rgb(107,114,128)',
      }}
    >
      Experience contemporary bliss with our sleek and cozy furniture
      collection, designed for optimal comfort and style
    </Text>
  </Row>
  <Row style={{ marginTop: 16 }}>
    <Column
      align="center"
      style={{
        width: '33.333333%',
        paddingRight: 12,
        verticalAlign: 'baseline',
      }}
    >
      <Img
        alt="heart icon"
        height="48"
        src="https://react.email/static/heart-icon.png"
        width="48"
      />
      <Text
        style={{
          margin: '0px',
          marginTop: 16,
          fontSize: 20,
          lineHeight: '24px',
          fontWeight: 600,
          color: 'rgb(17,24,39)',
        }}
      >
        Timeless Charm
      </Text>
      <Text
        style={{
          marginBottom: '0px',
          marginTop: 8,
          fontSize: 16,
          lineHeight: '24px',
          color: 'rgb(107,114,128)',
        }}
      >
        Classic designs that never go out of style. Experience enduring
        elegance
      </Text>
    </Column>
    <Column
      align="center"
      style={{
        width: '33.333333%',
        paddingLeft: 12,
        verticalAlign: 'baseline',
      }}
    >
      <Img
        alt="rocket icon"
        height="48"
        src="https://react.email/static/rocket-icon.png"
        width="48"
      />
      <Text
        style={{
          margin: '0px',
          marginTop: 16,
          fontSize: 20,
          lineHeight: '28px',
          fontWeight: 600,
          color: 'rgb(17,24,39)',
        }}
      >
        Functional Beauty
      </Text>
      <Text
        style={{
          marginBottom: '0px',
          marginTop: 8,
          fontSize: 16,
          lineHeight: '24px',
          color: 'rgb(107,114,128)',
        }}
      >
        Seamlessly blending form and function. Furniture that enhances your
        everyday life.
      </Text>
    </Column>
    <Column
      align="center"
      style={{
        width: '33.333333%',
        paddingLeft: 12,
        verticalAlign: 'baseline',
      }}
    >
      <Img
        alt="megaphone icon"
        height="48"
        src="https://react.email/static/megaphone-icon.png"
        width="48"
      />
      <Text
        style={{
          margin: '0px',
          marginTop: 16,
          fontSize: 20,
          lineHeight: '28px',
          fontWeight: 600,
          color: 'rgb(17,24,39)',
        }}
      >
        Endless Comfort
      </Text>
      <Text
        style={{
          marginBottom: '0px',
          marginTop: 8,
          fontSize: 16,
          lineHeight: '24px',
          color: 'rgb(107,114,128)',
        }}
      >
        Sink into pure relaxation. Discover furniture that embraces your
        well-being.
      </Text>
    </Column>
  </Row>
</Section>


Stats:

import { ResponsiveRow, ResponsiveColumn } from "@responsive-email/react-email";

<ResponsiveRow>
  <ResponsiveColumn>
    <p
      style={{
        margin: 0,
        textAlign: 'left',
        fontSize: '18px',
        lineHeight: '24px',
        fontWeight: 700,
        letterSpacing: '-0.025em',
        color: '#111827',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      42
    </p>
    <p
      style={{
        margin: 0,
        textAlign: 'left',
        fontSize: '12px',
        lineHeight: '18px',
        color: '#6b7280',
      }}
    >
      The Answer
    </p>
  </ResponsiveColumn>
  <ResponsiveColumn>
    <p
      style={{
        margin: 0,
        textAlign: 'left',
        fontSize: '18px',
        lineHeight: '24px',
        fontWeight: 700,
        letterSpacing: '-0.025em',
        color: '#111827',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      10M
    </p>
    <p
      style={{
        margin: 0,
        textAlign: 'left',
        fontSize: '12px',
        lineHeight: '18px',
        color: '#6b7280',
      }}
    >
      Days for Earth Mark II
    </p>
  </ResponsiveColumn>
  <ResponsiveColumn>
    <p
      style={{
        margin: 0,
        textAlign: 'left',
        fontSize: '18px',
        lineHeight: '24px',
        fontWeight: 700,
        letterSpacing: '-0.025em',
        color: '#111827',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      2^276,709:1
    </p>
    <p
      style={{
        margin: 0,
        textAlign: 'left',
        fontSize: '12px',
        lineHeight: '18px',
        color: '#6b7280',
      }}
    >
      Improbability Drive odds
    </p>
  </ResponsiveColumn>
</ResponsiveRow>

import { Section, Row, Column } from "@react-email/components";

<Section>
  <Row style={{ marginBottom: '8px' }}>
    <Column
      style={{
        minHeight: '112px',
        borderRadius: '16px',
        backgroundColor: '#f3f4f6',
        padding: '16px',
      }}
    >
      <p
        style={{
          marginBottom: '0',
          fontSize: '24px',
          lineHeight: '32px',
          fontWeight: 'bold',
          letterSpacing: '-0.025em',
          fontVariantNumeric: 'tabular-nums',
          color: '#111827',
        }}
      >
        42
      </p>
      <div style={{ color: '#374151' }}>
        <p
          style={{ marginBottom: '0', fontSize: '15px', lineHeight: '22px' }}
        >
          The Answer
        </p>
        <p
          style={{
            marginBottom: '0',
            marginTop: '4px',
            fontSize: '13px',
            lineHeight: '18px',
            color: '#4b5563',
          }}
        >
          To life, the universe, and everything computed by Deep Thought.
        </p>
      </div>
    </Column>
  </Row>
  <Row style={{ marginBottom: '8px' }}>
    <Column
      style={{
        minHeight: '192px',
        borderRadius: '16px',
        backgroundColor: '#111827',
        padding: '16px',
      }}
    >
      <p
        style={{
          marginBottom: '0',
          fontSize: '24px',
          lineHeight: '32px',
          fontWeight: 'bold',
          letterSpacing: '-0.025em',
          fontVariantNumeric: 'tabular-nums',
          color: '#f9fafb',
        }}
      >
        10M
      </p>
      <div style={{ color: '#d1d5db' }}>
        <p
          style={{ marginBottom: '0', fontSize: '15px', lineHeight: '22px' }}
        >
          Years for Earth Mark II
        </p>
        <p
          style={{
            marginBottom: '0',
            marginTop: '4px',
            fontSize: '13px',
            lineHeight: '18px',
            color: '#9ca3af',
          }}
        >
          Time required by Magrathea to build a replacement Earth.
        </p>
      </div>
    </Column>
  </Row>
  <Row>
    <Column
      style={{
        minHeight: '128px',
        borderRadius: '16px',
        backgroundColor: '#4338ca',
        padding: '16px',
      }}
    >
      <p
        style={{
          marginBottom: '0',
          fontSize: '24px',
          lineHeight: '32px',
          fontWeight: 'bold',
          letterSpacing: '-0.025em',
          fontVariantNumeric: 'tabular-nums',
          color: '#eef2ff',
        }}
      >
        2^276,709:1
      </p>
      <div style={{ color: '#e0e7ff' }}>
        <p
          style={{ marginBottom: '0', fontSize: '15px', lineHeight: '22px' }}
        >
          Improbability Drive odds
        </p>
        <p
          style={{
            marginBottom: '0',
            marginTop: '4px',
            fontSize: '13px',
            lineHeight: '18px',
            color: '#c7d2fe',
          }}
        >
          Chances against successfully activating the infinite improbability
          drive.
        </p>
      </div>
    </Column>
  </Row>
</Section>

Testimonials:

import { Section, Row, Column, Img } from "@react-email/components";

<Section
  style={{
    textAlign: 'center',
    fontSize: '14px',
    lineHeight: '20px',
    color: '#4b5563',
  }}
>
  <p
    style={{
      margin: 0,
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: 300,
      color: '#1f2937',
    }}
  >
    Design is not just what it looks like and feels like. Design is how it
    works. The people who are crazy enough to think they can change the world
    are the ones who do. Innovation distinguishes between a leader and a
    follower.
  </p>
  <Row
    style={{
      marginTop: '32px',
    }}
    width={undefined}
    align="center"
  >
    <Column valign="middle">
      <div
        style={{
          height: '32px',
          width: '32px',
          borderRadius: '9999px',
          overflow: 'hidden',
          backgroundColor: '#4b5563',
        }}
      >
        <Img
          src="https://react.email/static/steve-jobs.jpg"
          width={32}
          height={32}
          alt="Steve Jobs"
          style={{ height: '100%', width: '100%', objectFit: 'cover' }}
        />
      </div>
    </Column>
    <Column valign="middle">
      <p
        style={{
          margin: 0,
          marginLeft: '12px',
          fontSize: '14px',
          lineHeight: '20px',
          fontWeight: 600,
          color: '#111827',
          marginRight: 8,
        }}
      >
        Steve Jobs
      </p>
    </Column>
    <Column valign="middle">
      <span style={{ fontSize: '14px', lineHeight: '20px', marginRight: 8 }}>
        •
      </span>
    </Column>
    <Column valign="middle">
      <p
        style={{
          margin: 0,
          fontSize: '14px',
          lineHeight: '20px',
        }}
      >
        Co-founder of Apple
      </p>
    </Column>
  </Row>
</Section>

import { Img } from "@react-email/components";
import { ResponsiveRow, ResponsiveColumn } from "@responsive-email/react-email";

<ResponsiveRow
  style={{
    marginLeft: '12px',
    marginRight: '12px',
    marginTop: '16px',
    marginBottom: '16px',
    fontSize: '14px',
    color: '#4b5563',
  }}
>
  <ResponsiveColumn
    style={{
      marginTop: '0',
      marginRight: '24px',
      marginBottom: '24px',
      marginLeft: '0',
      width: '256px',
      overflow: 'hidden',
      borderRadius: '24px',
    }}
  >
    <Img
      src="https://react.email/static/steve-jobs.jpg"
      width={320}
      height={320}
      alt="Steve Jobs"
      style={{
        height: '320px',
        width: '100%',
        objectFit: 'cover',
        objectPosition: 'center',
      }}
    />
  </ResponsiveColumn>
  <ResponsiveColumn style={{ paddingRight: '24px' }}>
    <p
      style={{
        marginLeft: '0',
        marginRight: '0',
        marginTop: '0',
        marginBottom: '24px',
        textAlign: 'left',
        fontSize: '16px',
        lineHeight: '1.625',
        fontWeight: '300',
        color: '#374151',
      }}
    >
      Design is not just what it looks like and feels like. Design is how it
      works. The people who are crazy enough to think they can change the
      world are the ones who do. Innovation distinguishes between a leader and
      a follower.
    </p>
    <p
      style={{
        marginLeft: '0',
        marginRight: '0',
        marginTop: '0',
        marginBottom: '4px',
        textAlign: 'left',
        fontSize: '16px',
        fontWeight: '600',
        color: '#1f2937',
      }}
    >
      Steve Jobs
    </p>
    <p
      style={{
        margin: '0',
        textAlign: 'left',
        fontSize: '14px',
        color: '#4b5563',
      }}
    >
      Co-founder of Apple
    </p>
  </ResponsiveColumn>
</ResponsiveRow>

MArketing:

import { Html, Head, Body, Preview, Container, Section, Row, Column, Heading, Text, Link, Img } from "@react-email/components";

<Html>
  <Head />
  <Body>
    <Preview>Coffee Storage</Preview>
    <Container
      style={{
        backgroundColor: 'rgb(255,255,255)',
        borderRadius: '8px',
        marginLeft: 'auto',
        marginRight: 'auto',
        maxWidth: '900px',
        overflow: 'hidden',
        padding: '0px',
      }}
    >
      <Section>
        <Row
          style={{
            backgroundColor: 'rgb(41,37,36)',
            borderCollapse: 'separate',
            borderSpacing: '24px',
            margin: '0px',
            tableLayout: 'fixed',
            width: '100%',
          }}
        >
          <Column style={{ paddingLeft: '12px' }}>
            <Heading
              as="h1"
              style={{
                color: 'rgb(255,255,255)',
                fontSize: '28px',
                fontWeight: '700',
                marginBottom: '10px',
              }}
            >
              Coffee Storage
            </Heading>
            <Text
              style={{
                color: 'rgb(255,255,255,0.6)',
                fontSize: '14px',
                lineHeight: '20px',
                margin: '0px',
              }}
            >
              Keep your coffee fresher for longer with innovative technology.
            </Text>
            <Link
              href="#"
              style={{
                color: 'rgb(255,255,255,0.8)',
                display: 'block',
                fontSize: '14px',
                lineHeight: '20px',
                fontWeight: '600',
                marginTop: '12px',
                textDecorationLine: 'none',
              }}
            >
              Shop now →
            </Link>
          </Column>
          <Column style={{ width: '42%', height: '250px' }}>
            <Img
              src="https://react.email/static/coffee-bean-storage.jpg"
              alt="Coffee Bean Storage"
              style={{
                borderRadius: '4px',
                height: '100%',
                marginRight: '-6px',
                objectFit: 'cover',
                objectPosition: 'center',
                width: '100%',
              }}
            />
          </Column>
        </Row>
      </Section>
      <Section
        style={{
          marginBottom: '24px',
        }}
      >
        <Row
          style={{
            borderCollapse: 'separate',
            borderSpacing: '12px',
            tableLayout: 'fixed',
            width: '100%',
          }}
        >
          {[
            {
              imageUrl: '/static/atmos-vacuum-canister.jpg',
              altText: 'Auto-Sealing Vacuum Canister',
              title: 'Auto-Sealing Vacuum Canister',
              description:
                'A container that automatically creates an airtight seal with a button press.',
              linkUrl: '#',
            },
            {
              imageUrl: '/static/vacuum-canister-clear-glass-bundle.jpg',
              altText: '3-Pack Vacuum Containers',
              title: '3-Pack Vacuum Containers',
              description:
                'Keep your coffee fresher for longer with this set of high-performance vacuum containers.',
              linkUrl: '#',
            },
          ].map((product) => (
            <Column
              key={product.title}
              style={{
                marginLeft: 'auto',
                marginRight: 'auto',
                maxWidth: '180px',
              }}
            >
              <Img
                src={product.imageUrl}
                alt={product.altText}
                style={{
                  borderRadius: '4px',
                  marginBottom: '18px',
                  width: '100%',
                }}
              />
              <div>
                <Heading
                  as="h2"
                  style={{
                    fontSize: '14px',
                    lineHeight: '20px',
                    fontWeight: '700',
                    marginBottom: '8px',
                  }}
                >
                  {product.title}
                </Heading>
                <Text
                  style={{
                    color: 'rgb(107,114,128)',
                    fontSize: '12px',
                    lineHeight: '20px',
                    margin: '0px',
                    paddingRight: '12px',
                  }}
                >
                  {product.description}
                </Text>
              </div>
            </Column>
          ))}
        </Row>
      </Section>
    </Container>
  </Body>
</Html>

