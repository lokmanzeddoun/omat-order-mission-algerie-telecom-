import { SvgIcon, SvgIconProps } from '@mui/material';

interface IconifyProps extends SvgIconProps {
  icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
}

const IconifyIcon = ({ icon: IconComponent, ...rest }: IconifyProps) => {
  return <SvgIcon component={IconComponent} inheritViewBox {...rest} />;
};

export default IconifyIcon;
