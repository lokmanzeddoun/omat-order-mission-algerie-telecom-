import { Button, Card, List, ListItem, Stack, Typography } from '@mui/material';
import CardContainer from './CardContainer';
import IconifyIcon from 'components/base/IconifyIcon'; // Assuming you want to keep the icons from previous structure
const preloadUsers = () => import('pages/users');
import { useNavigate } from 'react-router-dom'; // for programmatic navigation

interface HasId {
  id: string | number;
  title: string;
  category: string;
  name: string;
}

interface SliderWrapperProps<T extends HasId> {
  title: string;
  data: T[];
}

const UserWrapper = <T extends HasId>({ title, data }: SliderWrapperProps<T>) => {
const navigate = useNavigate(); // For navigation
  const handleShowMoreClick = () => {
    preloadUsers();
    setTimeout(() => {
      navigate('/dashboard/users');
    }, 100);
  };
  return (
    <CardContainer title={title}>
      <Card sx={{ p: { xs: 0.5, xl: 1 } }}>
        <List disablePadding sx={{ color: 'primary.main', '& > *:not(:last-child)': { mb: 2.5 } }}>
          {data.map((item) => (
            <ListItem
              key={item.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                '&:hover': {
                  '& .title': { color: 'text.secondary' },
                  '& .details': { color: 'neutral.main', transform: 'translateX(2px)' },
                },
              }}
              disablePadding
            >
              {/* If you want to use an icon or avatar (optional) */}
              <Stack
                direction="row"
                sx={{
                  width: 55,
                  height: 55,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                }}
              >
                <IconifyIcon icon="mdi:account-circle" />
              </Stack>

              {/* The content (using SliderCard to render data) */}
              <Stack
                direction="row"
                sx={{ flexGrow: 1, justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Stack gap={1}>
                  {/* Title or name */}
                  <Typography
                    className="title"
                    sx={{
                      color: 'primary.darker',
                      fontSize: { xs: 'subtitle1.fontSize', md: 'body2.fontSize' },
                    }}
                  >
                    {item.name}
                  </Typography>

                  {/* Details (e.g., title or extra information) */}
                  <Typography
                    className="details"
                    sx={{
                      color: 'primary.light',
                      fontSize: { xs: 'caption.fontSize', sm: 'body1.fontSize' },
                    }}
                  >
                    {item.title}
                  </Typography>
                </Stack>

                {/* Other details or actions */}
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: {
                      xs: 'caption.fontSize',
                      sm: 'button.fontSize',
                      md: 'body1.fontSize',
                    },
                    alignSelf: 'flex-end',
                  }}
                >
                  {item.category}
                </Typography>
              </Stack>
            </ListItem>
          ))}
          <ListItem
            disablePadding
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 2,
            }}
          >
            <Button
              variant="outlined"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: 'primary.main',
                borderColor: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  bgcolor: 'primary.light',
                },
              }}
              onClick={handleShowMoreClick}
            >
              Show More
            </Button>
          </ListItem>
        </List>
      </Card>
    </CardContainer>
  );
};

export default UserWrapper;
