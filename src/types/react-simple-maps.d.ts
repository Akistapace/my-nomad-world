declare module "react-simple-maps" {
  import { ComponentType, SVGProps, ReactNode, CSSProperties } from "react";

  export interface GeographyStyle {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    outline?: string;
    cursor?: string;
  }

  export interface GeographyStyleSpec {
    default?: GeographyStyle;
    hover?: GeographyStyle;
    pressed?: GeographyStyle;
  }

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: {
      rotate?: [number, number, number];
      scale?: number;
      center?: [number, number];
    };
    width?: number;
    height?: number;
    style?: CSSProperties;
    children?: ReactNode;
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (args: { geographies: GeoFeature[] }) => ReactNode;
  }

  export interface GeoFeature {
    rsmKey: string;
    id: string | number;
    type: string;
    geometry: object;
    properties: Record<string, unknown>;
  }

  export interface GeographyProps {
    geography: GeoFeature;
    style?: GeographyStyleSpec;
    onClick?: (geo: GeoFeature, event: MouseEvent) => void;
    onMouseEnter?: (geo: GeoFeature, event: MouseEvent) => void;
    onMouseLeave?: (geo: GeoFeature, event: MouseEvent) => void;
    className?: string;
  }

  export interface MarkerProps {
    coordinates: [number, number];
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
  }

  export interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    children?: ReactNode;
    onMoveStart?: (position: object) => void;
    onMove?: (position: object) => void;
    onMoveEnd?: (position: object) => void;
    onZoomChangeStart?: (zoom: number) => void;
    onZoomChange?: (zoom: number) => void;
    onZoomChangeEnd?: (zoom: number) => void;
  }

  export const ComposableMap: ComponentType<ComposableMapProps>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
  export const Marker: ComponentType<MarkerProps>;
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>;
}
