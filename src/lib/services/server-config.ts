import servicesConfig from "@/data/services-config.json";

type ServiceConfigMap = Record<
  string,
  {
    directUrl?: string;
  }
>;

const config = servicesConfig as ServiceConfigMap;

export function getServerServiceUrl(serviceId: string) {
  return config[serviceId]?.directUrl?.trim() || "";
}